import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import puppeteer, {
  type Browser,
  type BrowserContext,
  type ElementHandle,
  type KeyInput,
  type Page,
} from "puppeteer-core";
import { z } from "zod";

import { findChrome } from "../../src/cli/browser.js";
import {
  type StudioServer,
  type StudioServerOptions,
  startStudioServer,
} from "../../src/server/server.js";
import {
  type ViewState,
  viewStateToSearch,
} from "../../src/shared/viewState.js";
import { writeGeneratedFixtures } from "../fixtures/gen.js";
import { accessibilityText } from "./a11y.js";
import { type HubStub, startHubStub } from "./hubStub.js";
import { freePort } from "./ports.js";

// The committed QA harness (spec §6.6). A harness is one Studio server on a
// temporary copy of e2e/fixtures, a Hub stub, and one page in a fresh browser
// context of a shared headless Chrome. Scenarios (e2e/scenarios/*.ts) get a
// Harness and drive the page by test id and role, never by visible text.

// ── Paths ─────────────────────────────────────────────────────────────────

export const STUDIO_DIR = path.resolve(import.meta.dirname, "..", "..");
export const FIXTURES_DIR = path.join(STUDIO_DIR, "e2e", "fixtures");
export const CLIENT_DIR = path.join(STUDIO_DIR, "dist", "client");
// Output of shots and accessibility text; STUDIO_E2E_OUT overrides it.
export const OUT_DIR = process.env["STUDIO_E2E_OUT"]
  ? path.resolve(process.env["STUDIO_E2E_OUT"])
  : path.join(STUDIO_DIR, "e2e-out");

// Files in e2e/fixtures that are harness inputs, not fixtures.
const NOT_FIXTURES = new Set([
  "gen.ts",
  "expectations.json",
  "hub-stub",
  "__golden__",
]);

export const IDLE_TIMEOUT_MS = 15_000; // Appendix A: idle within 15 s
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

// ── Frozen types (§6.6) ─────────────────────────────────────────────────────

export type { ViewState };

// What `window.squiggleStudio.getState()` returns (§6.5): the ViewState plus
// workspace facts. The same type as `UiState` in src/client/lib/agentHooks.ts,
// restated because the harness doesn't compile client code; keep them in step.
export type UiState = ViewState & {
  root?: string;
  host: "web" | "electron";
  dirtyFiles: string[];
  conflicts: string[];
  run: {
    status: "running" | "ok" | "error" | "not-run" | "none";
    ms?: number;
    executionId?: number;
    errors: Array<{
      kind: string;
      message: string;
      location?: { source: string; line: number; column: number };
    }>;
  };
  connected: boolean;
  followChanges: boolean;
  // The global layout (not `layout`, which is Output's Cards/List).
  shellLayout: {
    sidebarVisible: boolean;
    sidebarWidth: number;
    statusBarVisible: boolean;
    menuBarVisible: boolean;
    codePane: { open: boolean; fraction: number };
    outputLayout: "cards" | "list";
  };
};

export type HarnessOptions = {
  fixtures?: string; // subfolder of e2e/fixtures, default all
  viewport?: { width: number; height: number }; // default 1440x900
  hub?: "stub" | "none"; // default "stub"
  query?: Record<string, string>; // e.g. { menubar: "1" }
};

export type Harness = {
  url: string;
  root: string;
  page: Page;
  open(state: ViewState): Promise<void>; // navigates, then whenIdle()
  whenIdle(timeoutMs?: number): Promise<void>;
  byTestId(id: string, attrs?: Record<string, string>): Promise<ElementHandle>;
  command(id: string, args?: unknown): Promise<void>; // window.squiggleStudio.commands.run
  key(combo: string): Promise<void>; // "Meta+P", "ArrowDown"
  state(): Promise<UiState>;
  writeFile(rel: string, content: string): Promise<void>; // simulates an agent edit (plain fs write)
  removeFile(rel: string): Promise<void>;
  readFile(rel: string): Promise<string>;
  shot(name: string): Promise<string>; // writes a PNG, resolves to its path
  a11y(name: string): Promise<string>; // writes the accessibility text, resolves to it
  errors: {
    console: string[];
    page: string[];
    failedRequests: string[];
    dialogs: string[];
  };
  stopServer(): Promise<void>;
  startServer(): Promise<void>; // same port and root (simulates a restart)
  stop(): Promise<void>;
};

export type Scenario = {
  id: string; // "area/name"
  title: string;
  tags: string[]; // e.g. ["layout", "needs:WP4"]
  fixtures?: string;
  viewport?: { width: number; height: number };
  state?: ViewState; // opened before steps (the start page if absent)
  query?: Record<string, string>;
  steps?: (h: Harness) => Promise<void>; // may call h.shot()
  check?: (h: Harness) => Promise<void>; // assertions (vitest expect)
};

// ── Expectations (e2e/fixtures/expectations.json) ──────────────────────────

const expectationSchema = z.object({
  views: z.array(z.string()).default([]),
  defaultView: z.string().optional(),
  errorCount: z.number().int().nonnegative().default(0),
  cardCount: z.number().int().nonnegative().optional(),
  rvSpecs: z.array(z.string()).default([]),
  rvInvalid: z.array(z.string()).default([]),
  inTree: z.boolean().default(true),
  generated: z.boolean().default(false),
  note: z.string().optional(),
});
export type Expectation = z.infer<typeof expectationSchema>;

let expectationsCache: Record<string, Expectation> | undefined;

// Keyed by path relative to e2e/fixtures.
export function loadExpectations(): Record<string, Expectation> {
  expectationsCache ??= z
    .record(expectationSchema)
    .parse(
      JSON.parse(
        fs.readFileSync(path.join(FIXTURES_DIR, "expectations.json"), "utf-8")
      )
    );
  return expectationsCache;
}

export function expectationFor(
  file: string,
  fixtures?: string
): Expectation | undefined {
  const key = fixtures ? `${fixtures.replace(/\/+$/, "")}/${file}` : file;
  return loadExpectations()[key];
}

// ── Shared browser ─────────────────────────────────────────────────────────

let browserPromise: Promise<Browser> | undefined;

export function sharedBrowser(): Promise<Browser> {
  browserPromise ??= puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    defaultViewport: null,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--force-color-profile=srgb",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });
  return browserPromise;
}

export async function closeSharedBrowser(): Promise<void> {
  const pending = browserPromise;
  browserPromise = undefined;
  if (pending) await (await pending).close();
}

// tsx (shoot.ts, serve.ts) compiles with esbuild's keepNames, which wraps
// functions in `__name(...)` calls; functions passed to page.evaluate then
// fail in the page with "__name is not defined". Define it in every document.
const NAME_SHIM =
  "globalThis.__name = globalThis.__name || function (target) { return target; };";

// ── Fixture server (also used by e2e:serve) ────────────────────────────────

export type FixtureServer = {
  url: string;
  root: string; // the temporary copy of the fixtures
  stateDir: string; // isolated replacement for ~/.squiggle-studio
  port: number;
  hub?: HubStub;
  server(): StudioServer | undefined; // undefined while stopped
  stopServer(): Promise<void>;
  startServer(): Promise<void>;
  stop(): Promise<void>;
};

function assertClientBuilt() {
  if (!fs.existsSync(path.join(CLIENT_DIR, "index.html"))) {
    throw new Error(
      `The Studio client isn't built (${CLIENT_DIR} is missing). Run \`pnpm build:client\` (pnpm e2e and e2e:shoot do this).`
    );
  }
}

async function copyFixtures(subfolder: string | undefined, dest: string) {
  const src = subfolder ? path.join(FIXTURES_DIR, subfolder) : FIXTURES_DIR;
  if (!fs.statSync(src, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`No fixtures folder ${src}`);
  }
  await fsp.cp(src, dest, {
    recursive: true,
    filter: (from) => {
      const rel = path.relative(FIXTURES_DIR, from);
      const top = rel.split(path.sep)[0] ?? "";
      return !NOT_FIXTURES.has(top);
    },
  });
  await writeGeneratedFixtures(dest, subfolder);
}

export async function startFixtureServer(
  opts: {
    fixtures?: string;
    hub?: "stub" | "none";
    dev?: boolean; // serve the client through Vite (e2e:serve --dev only)
  } = {}
): Promise<FixtureServer> {
  if (!opts.dev) assertClientBuilt();
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "studio-e2e-"));
  const root = path.join(
    tmp,
    opts.fixtures ? path.basename(opts.fixtures) : "fixtures"
  );
  const stateDir = path.join(tmp, "state");
  await fsp.mkdir(stateDir, { recursive: true });
  await copyFixtures(opts.fixtures, root);

  const hub = opts.hub === "none" ? undefined : await startHubStub();
  const port = await freePort();
  // State, settings and recent folders all live in the temporary `stateDir`,
  // away from ~/.squiggle-studio.
  const serverOptions: StudioServerOptions = {
    root,
    port,
    strictPort: true,
    recentFile: path.join(stateDir, "recent.json"),
    stateDir,
    trackRecent: false,
    // Without the stub, point at a closed port so nothing reaches the real Hub.
    hubUrl: hub?.url ?? "http://127.0.0.1:9",
    dev: opts.dev ?? false,
  };
  let server: StudioServer | undefined = await startStudioServer(serverOptions);
  const url = server.url;

  return {
    url,
    root,
    stateDir,
    port,
    hub,
    server: () => server,
    async stopServer() {
      const running = server;
      server = undefined;
      await running?.close();
    },
    async startServer() {
      if (server) throw new Error("The Studio server is already running");
      server = await startStudioServer(serverOptions);
    },
    async stop() {
      const running = server;
      server = undefined;
      await running?.close();
      await hub?.close();
      await fsp.rm(tmp, { recursive: true, force: true });
    },
  };
}

// ── In-page access to Studio ───────────────────────────────────────────────

type IdleResult = {
  idle: boolean;
  timedOut: boolean;
  waitedMs: number;
  // window.squiggleStudio wasn't installed within the timeout.
  noApi?: boolean;
  // window.squiggleStudio.whenIdle() resolved while the shown file's view
  // wasn't ready yet (its [data-studio-ready] marker missing or "0").
  earlyApi?: boolean;
};
type CommandResult = { ok: true } | { ok: false; error: string };
type CommandLogEntry = { id: string; source?: string; at?: number };
type StudioWindow = Window & {
  squiggleStudio?: {
    whenIdle?: (
      timeoutMs?: number
    ) => Promise<{ idle: boolean; timedOut: boolean; waitedMs: number }>;
    commands?: {
      run(id: string, args?: unknown): Promise<CommandResult>;
    };
    getState?: () => unknown;
  };
  __studioCommandLog?: CommandLogEntry[];
};

// Runs in the page. Waits for window.squiggleStudio (App installs it in an
// effect, so it can arrive just after "load"), then for its whenIdle().
// The shown view must also have settled, which checks whenIdle() itself: when
// a .squiggle file is shown (per <html data-studio-active-file>, or while
// nothing is shown yet, ?file=) outside the Playground, every
// [data-studio-ready] marker is "1" or there is a [data-studio-error], and no
// relative values dashboard is computing. Then fonts and two animation frames.
async function idleInPage(timeoutMs: number): Promise<IdleResult> {
  const w = window as StudioWindow;
  const start = performance.now();
  const elapsed = () => performance.now() - start;
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const frame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const settled = (): boolean => {
    const html = document.documentElement;
    const params = new URLSearchParams(location.search);
    const activeFile =
      html.dataset["studioActiveFile"] ?? params.get("file") ?? "";
    const view = html.dataset["studioView"] ?? params.get("view") ?? "";
    if (document.querySelector("[data-rv-computing]")) return false;
    if (document.querySelector("[data-studio-error]")) return true;
    const markers = [...document.querySelectorAll("[data-studio-ready]")];
    if (markers.some((m) => m.getAttribute("data-studio-ready") !== "1")) {
      return false;
    }
    const needsRun = activeFile.endsWith(".squiggle") && view !== "split";
    return !needsRun || markers.length > 0;
  };

  let api = w.squiggleStudio?.whenIdle;
  while (typeof api !== "function") {
    if (elapsed() >= timeoutMs) {
      return { idle: false, timedOut: true, waitedMs: elapsed(), noApi: true };
    }
    await sleep(10);
    api = w.squiggleStudio?.whenIdle;
  }
  const result = await api(Math.max(0, timeoutMs - elapsed()));
  if (!result.idle || settled()) {
    return { ...result, waitedMs: elapsed() };
  }
  while (elapsed() < timeoutMs && !settled()) await sleep(25);
  const idle = settled();
  if (idle) {
    await document.fonts.ready;
    await frame();
    await frame();
  }
  return { idle, timedOut: !idle, waitedMs: elapsed(), earlyApi: true };
}

// Runs in the page.
function stateInPage(): UiState {
  const getState = (window as StudioWindow).squiggleStudio?.getState;
  if (typeof getState !== "function") {
    throw new Error("window.squiggleStudio.getState is not installed");
  }
  return getState() as UiState;
}

// ── Keys ───────────────────────────────────────────────────────────────────

const MODIFIERS: Record<string, KeyInput> = {
  meta: "Meta",
  cmd: "Meta",
  command: "Meta",
  ctrl: "Control",
  control: "Control",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
};

function parseCombo(combo: string): { modifiers: KeyInput[]; key: string } {
  // "Meta++" means Meta and the "+" key.
  const plus = combo.endsWith("++");
  const parts = (plus ? combo.slice(0, -2) : combo).split("+").filter(Boolean);
  const key = plus ? "+" : (parts.pop() ?? "");
  if (!key) throw new Error(`Invalid key combo "${combo}"`);
  const modifiers = parts.map((part) => {
    if (part.toLowerCase() === "mod") {
      return process.platform === "darwin" ? "Meta" : "Control";
    }
    const modifier = MODIFIERS[part.toLowerCase()];
    if (!modifier) throw new Error(`Unknown modifier "${part}" in "${combo}"`);
    return modifier;
  });
  return { modifiers, key };
}

// ── The harness ────────────────────────────────────────────────────────────

// Fields the scenario runner and e2e:shoot use on top of the frozen Harness.
export type HarnessInternal = Harness & {
  fixtureServer: FixtureServer;
  context: BrowserContext;
  idleResults: IdleResult[]; // every whenIdle(), in order
  idleTimeouts: string[];
  idleWarnings: string[]; // whenIdle() API answers the markers contradicted
  keypressViolations: string[]; // keys that ran more than one command
  shots: string[]; // PNG paths, in order
  lastOpenMs?: number; // navigation start to idle, for the latest open()
  commandLog(): Promise<CommandLogEntry[] | null>; // window.__studioCommandLog
  studioErrors(): Promise<string[]>; // text of [data-studio-error] markers
};

export type HarnessOutput = {
  dir: string; // shots go to <dir>/shots, accessibility text to <dir>/a11y
  prefix: string; // shot file name prefix, e.g. "03-smoke-start"
  a11yPrefix?: string; // accessibility text file name prefix (default: prefix)
};

export class IdleTimeoutError extends Error {}

export function sanitizeName(name: string): string {
  return name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function startHarness(opts: HarnessOptions = {}): Promise<Harness> {
  return startHarnessInternal(opts, {
    dir: path.join(OUT_DIR, "harness"),
    prefix: "",
  });
}

export async function startHarnessInternal(
  opts: HarnessOptions,
  output: HarnessOutput
): Promise<HarnessInternal> {
  const fixtureServer = await startFixtureServer({
    fixtures: opts.fixtures,
    hub: opts.hub ?? "stub",
  });
  const viewport = opts.viewport ?? DEFAULT_VIEWPORT;
  let context: BrowserContext | undefined;
  try {
    const browser = await sharedBrowser();
    context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.evaluateOnNewDocument(NAME_SHIM);
    page.setDefaultTimeout(IDLE_TIMEOUT_MS);
    return createHarness(page, context, fixtureServer, opts, output);
  } catch (e) {
    await context?.close().catch(() => undefined);
    await fixtureServer.stop();
    throw e;
  }
}

function createHarness(
  page: Page,
  context: BrowserContext,
  fixtureServer: FixtureServer,
  opts: HarnessOptions,
  output: HarnessOutput
): HarnessInternal {
  const root = fixtureServer.root;
  const errors: Harness["errors"] = {
    console: [],
    page: [],
    failedRequests: [],
    dialogs: [],
  };
  page.on("console", (message) => {
    if (message.type() === "error") errors.console.push(message.text());
  });
  page.on("pageerror", (error: unknown) => {
    errors.page.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error)
    );
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "failed";
    // Navigations abort the live-reload stream; that's expected.
    if (
      request.url().includes("/api/events") &&
      failure === "net::ERR_ABORTED"
    ) {
      return;
    }
    errors.failedRequests.push(
      `${request.method()} ${request.url()}: ${failure}`
    );
  });
  page.on("dialog", (dialog) => {
    errors.dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss().catch(() => undefined);
  });

  const insideRoot = (rel: string): string => {
    const abs = path.resolve(root, rel);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      throw new Error(`Path outside the fixture root: ${rel}`);
    }
    return abs;
  };
  // <prefix>.<ext> for the scenario's own name (or the prefix itself),
  // <prefix>--<name>.<ext> otherwise.
  const outFile = (kind: "shots" | "a11y", name: string, ext: string) => {
    const prefix =
      kind === "a11y" ? (output.a11yPrefix ?? output.prefix) : output.prefix;
    const base = sanitizeName(name);
    const own =
      !base ||
      base === prefix ||
      base === output.prefix ||
      base === output.a11yPrefix;
    const file = prefix ? (own ? prefix : `${prefix}--${base}`) : base || kind;
    return path.join(output.dir, kind, `${file}.${ext}`);
  };

  const commandLog = (): Promise<CommandLogEntry[] | null> =>
    page.evaluate(() => {
      const log = (window as StudioWindow).__studioCommandLog;
      return Array.isArray(log) ? log.map((e) => ({ ...e })) : null;
    });

  const h: HarnessInternal = {
    url: fixtureServer.url,
    root,
    page,
    errors,
    fixtureServer,
    context,
    idleResults: [],
    idleTimeouts: [],
    idleWarnings: [],
    keypressViolations: [],
    shots: [],
    commandLog,

    async open(state) {
      const params = new URLSearchParams(viewStateToSearch(state));
      for (const [k, v] of Object.entries(opts.query ?? {})) params.set(k, v);
      params.set("test", "1");
      const started = Date.now();
      await page.goto(`${h.url}/?${params}`, { waitUntil: "load" });
      await h.whenIdle();
      h.lastOpenMs = Date.now() - started;
    },

    async whenIdle(timeoutMs = IDLE_TIMEOUT_MS) {
      const result = await page.evaluate(idleInPage, timeoutMs);
      h.idleResults.push(result);
      if (result.earlyApi) {
        h.idleWarnings.push(
          `window.squiggleStudio.whenIdle() resolved before the shown view was ready (at ${page.url()})`
        );
      }
      if (!result.idle) {
        const message = result.noApi
          ? `window.squiggleStudio wasn't installed within ${timeoutMs} ms at ${page.url()}`
          : `Studio didn't go idle within ${timeoutMs} ms at ${page.url()}`;
        h.idleTimeouts.push(message);
        throw new IdleTimeoutError(message);
      }
    },

    async byTestId(id, attrs = {}) {
      const selector = [
        `[data-testid="${id}"]`,
        ...Object.entries(attrs).map(
          ([k, v]) =>
            `[${k.startsWith("data-") || k.startsWith("aria-") ? k : `data-${k}`}="${escapeAttr(v)}"]`
        ),
      ].join("");
      const handle = await page
        .waitForSelector(selector, { timeout: 5_000 })
        .catch(() => null);
      if (!handle) throw new Error(`No element matches ${selector}`);
      return handle;
    },

    async command(id, args) {
      const result = await page.evaluate(
        async (commandId: string, commandArgs: unknown) => {
          const commands = (window as StudioWindow).squiggleStudio?.commands;
          if (!commands) {
            return {
              ok: false as const,
              error: "window.squiggleStudio is not installed",
            };
          }
          return commands.run(commandId, commandArgs);
        },
        id,
        args
      );
      if (!result.ok) throw new Error(`Command ${id} failed: ${result.error}`);
    },

    async key(combo) {
      const { modifiers, key } = parseCombo(combo);
      const shift = modifiers.includes("Shift");
      const name =
        key.length === 1 && /[a-z]/i.test(key)
          ? shift
            ? key.toUpperCase()
            : key.toLowerCase()
          : key;
      const before = await commandLog();
      for (const m of modifiers) await page.keyboard.down(m);
      try {
        await page.keyboard.press(name as KeyInput);
      } finally {
        for (const m of [...modifiers].reverse()) await page.keyboard.up(m);
      }
      // Key handlers run synchronously; menu and palette runs on the next frame.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );
      const after = await commandLog();
      if (after) {
        // The log is capped, so find where the old entries end.
        const last = before?.at(-1);
        const from = last
          ? after.findLastIndex((e) => e.id === last.id && e.at === last.at) + 1
          : 0;
        const ran = after.slice(from).map((e) => e.id);
        if (ran.length > 1) {
          h.keypressViolations.push(
            `${combo} ran ${ran.length} commands: ${ran.join(", ")}`
          );
        }
      }
    },

    state: () => page.evaluate(stateInPage),

    async writeFile(rel, content) {
      const abs = insideRoot(rel);
      await fsp.mkdir(path.dirname(abs), { recursive: true });
      await fsp.writeFile(abs, content);
    },
    async removeFile(rel) {
      await fsp.rm(insideRoot(rel), { recursive: true });
    },
    readFile: (rel) => fsp.readFile(insideRoot(rel), "utf-8"),

    async shot(name) {
      const file = outFile("shots", name, "png");
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file as `${string}.png`, fullPage: true });
      h.shots.push(file);
      return file;
    },

    async a11y(name) {
      const text = await accessibilityText(page);
      const file = outFile("a11y", name, "txt");
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, text);
      return text;
    },

    studioErrors: () =>
      page.evaluate(() =>
        [...document.querySelectorAll("[data-studio-error]")].map((el) =>
          (el.textContent ?? "").trim()
        )
      ),

    stopServer: () => fixtureServer.stopServer(),
    startServer: () => fixtureServer.startServer(),

    async stop() {
      await context.close().catch(() => undefined);
      await fixtureServer.stop();
    },
  };
  return h;
}

// Attribute values in selectors: escape quotes and backslashes.
function escapeAttr(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}
