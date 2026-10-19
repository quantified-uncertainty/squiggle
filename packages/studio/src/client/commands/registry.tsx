// The runtime command registry (§4.3). Handlers live where their state lives
// and register with useCommand; every surface (keys, menus, the palette,
// buttons, Electron's native menu, agents) runs commands through runCommand.
//
// A command is enabled when its precondition holds, a handler is mounted and
// that handler's `enabled` option isn't false. Disabled commands are hidden
// in the palette, disabled in menus and buttons, and their keys pass through.

import {
  FC,
  PropsWithChildren,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import { useToast } from "@quri/ui";

import {
  bindingsFor,
  type CommandSpec,
  formatKey,
  getCommand,
  isAvailableOnHost,
  keyForPlatform,
  radioValue,
  STUDIO_COMMANDS,
} from "../../shared/commands/index.js";
import { host, subscribeHost } from "../lib/host.js";
import { getContext, publishContextKeys, subscribeContext } from "./context.js";
import { installDispatcher } from "./dispatcher.js";
import { installFocusTracking } from "./focus.js";
import { evaluateWhen } from "./when.js";

export type CommandSource =
  | "key"
  | "palette"
  | "menu"
  | "menu-key" // an Electron accelerator via the native menu
  | "button"
  | "api";

// Return `false` for "not handled".
export type CommandHandler = (args?: unknown) => void | boolean | Promise<void>;

export type CommandOptions = { enabled?: boolean; checked?: boolean };

export type CommandState = {
  enabled: boolean;
  checked?: boolean;
  keys: string[]; // formatted bindings for this platform and host; the first is primary
  title: string;
};

export type CommandLogEntry = {
  id: string;
  source: CommandSource;
  at: number;
  args?: unknown;
};

declare global {
  interface Window {
    // Every run, in dev builds and with ?test=1 (the harness asserts one run
    // per keypress).
    __studioCommandLog?: CommandLogEntry[];
  }
}

// A "menu" or "menu-key" call within this long after a "key" call for the
// same id is the Electron double-fire backstop and is dropped.
export const MENU_KEY_DEDUPE_MS = 100;

type Registration = {
  token: number;
  handler: () => CommandHandler;
  options: CommandOptions;
};

let nextToken = 1;
const registrations = new Map<string, Registration[]>();
const listeners = new Set<() => void>();
const lastKeyRun = new Map<string, number>();
let version = 0;
let reportError: (message: string) => void = (message) =>
  console.error(message);

function notify() {
  version++;
  for (const cb of [...listeners]) cb();
}

// Host keys (§4.4), republished when tests override the host.
let hostKeysToken: number | undefined;
function publishHostKeys() {
  hostKeysToken = publishContextKeys(
    {
      host: host.kind,
      isElectron: host.kind === "electron",
      isWeb: host.kind === "web",
      isMac: host.platform === "mac",
      isWindows: host.platform === "win",
      isLinux: host.platform === "linux",
    },
    hostKeysToken
  );
}
publishHostKeys();
subscribeHost(publishHostKeys);
subscribeContext(notify);

function logEnabled(): boolean {
  return (
    import.meta.env.DEV ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("studio-test"))
  );
}

function log(entry: CommandLogEntry) {
  if (typeof window === "undefined" || !logEnabled()) return;
  const entries = (window.__studioCommandLog ??= []);
  entries.push(entry);
  if (entries.length > 500) entries.splice(0, entries.length - 500);
}

// ── Registration ───────────────────────────────────────────────────────────

// Low-level registration (React components use useCommand). The most recently
// registered handler for an id wins. Returns an unregister function.
export function registerCommand(
  id: string,
  handler: CommandHandler | (() => CommandHandler),
  options: CommandOptions = {},
  // Pass `true` when `handler` is a getter (useCommand keeps it in a ref).
  isGetter = false
): () => void {
  if (!getCommand(id)) {
    throw new Error(`registerCommand: unknown command "${id}"`);
  }
  const token = nextToken++;
  const get = isGetter
    ? (handler as () => CommandHandler)
    : () => handler as CommandHandler;
  const list = registrations.get(id) ?? [];
  list.push({ token, handler: get, options });
  registrations.set(id, list);
  notify();
  return () => {
    const current = registrations.get(id);
    if (!current) return;
    const index = current.findIndex((r) => r.token === token);
    if (index === -1) return;
    current.splice(index, 1);
    if (!current.length) registrations.delete(id);
    notify();
  };
}

function activeRegistration(id: string): Registration | undefined {
  const list = registrations.get(id);
  return list?.[list.length - 1];
}

function updateOptions(id: string, token: number, options: CommandOptions) {
  const reg = registrations.get(id)?.find((r) => r.token === token);
  if (!reg) return;
  if (
    reg.options.enabled === options.enabled &&
    reg.options.checked === options.checked
  ) {
    return;
  }
  reg.options = options;
  notify();
}

// Registers `handler` for `id` while the component is mounted. The handler is
// kept in a ref (no re-registration when it changes); registration uses
// tokens, so StrictMode's mount → unmount → mount is safe.
export function useCommand(
  id: string,
  handler: CommandHandler,
  opts?: CommandOptions
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const tokenRef = useRef<number | undefined>(undefined);
  const enabled = opts?.enabled;
  const checked = opts?.checked;
  const optsRef = useRef<CommandOptions>({ enabled, checked });
  optsRef.current = { enabled, checked };

  useLayoutEffect(() => {
    const unregister = registerCommand(
      id,
      () => (args?: unknown) => handlerRef.current(args),
      optsRef.current,
      true
    );
    const reg = activeRegistration(id);
    tokenRef.current = reg?.token;
    return () => {
      tokenRef.current = undefined;
      unregister();
    };
  }, [id]);

  useLayoutEffect(() => {
    if (tokenRef.current !== undefined) {
      updateOptions(id, tokenRef.current, { enabled, checked });
    }
  }, [id, enabled, checked]);
}

// ── State ──────────────────────────────────────────────────────────────────

export function hasHandler(id: string): boolean {
  return activeRegistration(id) !== undefined;
}

// Why a command can't run right now, or undefined if it can.
function disabledReason(spec: CommandSpec): string | undefined {
  if (!isAvailableOnHost(spec, host.kind)) {
    return `disabled: not available in ${host.kind === "web" ? "a browser" : "the desktop app"}`;
  }
  if (!evaluateWhen(spec.precondition, getContext())) {
    return `disabled: ${spec.precondition}`;
  }
  const reg = activeRegistration(spec.id);
  if (!reg) return "disabled: no handler is mounted";
  if (reg.options.enabled === false) return "disabled: not available now";
  return undefined;
}

export function isCommandEnabled(id: string): boolean {
  const spec = getCommand(id);
  return spec !== undefined && disabledReason(spec) === undefined;
}

// Checkmark / radio state: the handler's `checked` option, else `toggled`
// evaluated, else the radio group compared with the item's value.
export function isCommandChecked(
  id: string,
  args?: unknown
): boolean | undefined {
  const spec = getCommand(id);
  if (!spec) return undefined;
  const reg = activeRegistration(id);
  if (reg?.options.checked !== undefined) return reg.options.checked;
  if (spec.toggled) return evaluateWhen(spec.toggled, getContext());
  if (spec.radio) {
    const value = radioValue(spec, args);
    if (value === undefined) return undefined;
    return getContext()[spec.radio.group] === value;
  }
  return undefined;
}

// The formatted keys of a command for this platform and host ("⌘B"), first
// the one to show in menus and tooltips.
export function commandKeys(spec: CommandSpec): string[] {
  return bindingsFor(spec, host.platform, host.kind).flatMap((b) => {
    const key = keyForPlatform(b, host.platform);
    return key ? [formatKey(key, host.platform)] : [];
  });
}

export function getCommandState(id: string, args?: unknown): CommandState {
  const spec = getCommand(id);
  if (!spec) return { enabled: false, keys: [], title: id };
  return {
    enabled: disabledReason(spec) === undefined,
    checked: isCommandChecked(id, args),
    keys: commandKeys(spec),
    title: spec.title,
  };
}

export function subscribeCommands(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getVersion = () => version;

export function useCommandState(id: string, args?: unknown): CommandState {
  const v = useSyncExternalStore(subscribeCommands, getVersion, getVersion);
  const argsKey = args === undefined ? "" : JSON.stringify(args);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getCommandState(id, args), [id, argsKey, v]);
}

export function listCommands(): Array<{
  spec: CommandSpec;
  enabled: boolean;
  checked?: boolean;
  keys: string[];
}> {
  return STUDIO_COMMANDS.filter((spec) =>
    isAvailableOnHost(spec, host.kind)
  ).map((spec) => ({
    spec,
    enabled: disabledReason(spec) === undefined,
    checked: isCommandChecked(spec.id),
    keys: commandKeys(spec),
  }));
}

// ── Running ────────────────────────────────────────────────────────────────

type RunResult = { ok: true } | { ok: false; error: string };

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function invoke(
  spec: CommandSpec,
  args: unknown,
  source: CommandSource
): Promise<RunResult> {
  // Palette and menu runs: the surface has closed and restored focus; run
  // on the next frame so the command acts on the restored focus.
  if (source === "palette" || source === "menu" || source === "menu-key") {
    await nextFrame();
  }
  const reg = activeRegistration(spec.id);
  if (!reg) return { ok: false, error: "disabled: no handler is mounted" };
  const result = reg.handler()(args);
  if (result === false) return { ok: false, error: "not handled" };
  if (result instanceof Promise) await result;
  return { ok: true };
}

function check(
  id: string,
  source: CommandSource
): { spec: CommandSpec } | { dropped: true } | { error: string } {
  const spec = getCommand(id);
  if (!spec) return { error: "unknown command" };
  const now = Date.now();
  if (source === "menu" || source === "menu-key") {
    const keyAt = lastKeyRun.get(id);
    if (keyAt !== undefined && now - keyAt < MENU_KEY_DEDUPE_MS) {
      return { dropped: true };
    }
  }
  if (source === "menu-key") {
    // A key the page left unhandled must not reach a command out of context
    // (F2 in the code editor reaches the native Rename item on macOS, but
    // its binding is filesExplorerFocus-only).
    const ctx = getContext();
    const bindings = bindingsFor(spec, host.platform, host.kind);
    if (!bindings.some((b) => evaluateWhen(b.when, ctx))) {
      return { error: "disabled: no binding applies here" };
    }
  }
  const reason = disabledReason(spec);
  if (reason) return { error: reason };
  if (source === "key") lastKeyRun.set(id, now);
  return { spec };
}

// Runs a command. Returns false if it is unknown or disabled (or, for
// immediate sources, its handler returned false); true otherwise, including
// a dropped Electron double-fire. Errors thrown by async handlers are shown as
// a toast.
export function runCommand(
  id: string,
  args?: unknown,
  source: CommandSource = "api"
): boolean {
  const checked = check(id, source);
  if ("dropped" in checked) return true;
  if ("error" in checked) return false;
  const finalArgs = args ?? checked.spec.args;
  log({ id, source, at: Date.now(), args: finalArgs });
  const deferred =
    source === "palette" || source === "menu" || source === "menu-key";
  if (deferred) {
    invoke(checked.spec, finalArgs, source)
      .then((r) => {
        if (!r.ok && r.error !== "not handled") reportError(r.error);
      })
      .catch((e: unknown) => reportError(errorMessage(e)));
    return true;
  }
  const reg = activeRegistration(id);
  if (!reg) return false;
  let result: ReturnType<CommandHandler>;
  try {
    result = reg.handler()(finalArgs);
  } catch (e) {
    reportError(errorMessage(e));
    return true;
  }
  if (result === false) return false;
  if (result instanceof Promise) {
    result.catch((e: unknown) => reportError(errorMessage(e)));
  }
  return true;
}

// Like runCommand, but waits for the handler and reports why it didn't run:
// "unknown command", "disabled: <precondition>", "not handled" or the thrown
// message.
export async function runCommandAsync(
  id: string,
  args?: unknown,
  source: CommandSource = "api"
): Promise<RunResult> {
  const checked = check(id, source);
  if ("dropped" in checked) return { ok: true };
  if ("error" in checked) return { ok: false, error: checked.error };
  const finalArgs = args ?? checked.spec.args;
  log({ id, source, at: Date.now(), args: finalArgs });
  try {
    return await invoke(checked.spec, finalArgs, source);
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ── Provider ───────────────────────────────────────────────────────────────

// Installs the focus tracker, the key dispatcher and the Electron command
// bridge, and shows command errors as toasts. Mounted in main.tsx inside
// WithToasts.
export const CommandsProvider: FC<PropsWithChildren> = ({ children }) => {
  const toast = useToast();

  useLayoutEffect(() => {
    reportError = (message) => toast(message, "error");
  }, [toast]);

  useLayoutEffect(() => {
    const stopFocus = installFocusTracking();
    const stopDispatcher = installDispatcher({
      commands: STUDIO_COMMANDS,
      isEnabled: isCommandEnabled,
      run: (id, args) => runCommand(id, args, "key"),
      getContext,
    });
    const stopHost = host.onCommand((id, args, viaKey) => {
      if (!getCommand(id)) return;
      runCommand(id, args, viaKey ? "menu-key" : "menu");
    });
    return () => {
      stopFocus();
      stopDispatcher();
      stopHost();
    };
  }, []);

  return <>{children}</>;
};

// For tests.
export function resetRegistryForTests(): void {
  registrations.clear();
  lastKeyRun.clear();
  reportError = (message) => console.error(message);
  if (typeof window !== "undefined") window.__studioCommandLog = [];
  notify();
}

export function setCommandErrorReporter(fn: (message: string) => void): void {
  reportError = fn;
}
