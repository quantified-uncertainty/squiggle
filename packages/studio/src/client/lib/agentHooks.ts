// window.squiggleStudio (§6.5): hooks for agents, the e2e harness and the
// Electron shell. App installs it; packages add providers for the data they
// own (getRunJson: WP8, getRvMatrix: WP6).

import type { ViewState } from "../../shared/viewState.js";
import { listCommands, runCommandAsync } from "../commands/registry.js";
import { host } from "./host.js";
import { whenIdle } from "./idle.js";
import { getViewState } from "./navigation.js";
import { type ActiveRun, getActiveRun } from "./stores/activeRun.js";
import { getFullLayout, type Layout } from "./stores/layout.js";
import { getSettings } from "./studioState.js";

export type UiState = ViewState & {
  root?: string;
  host: "web" | "electron";
  dirtyFiles: string[];
  conflicts: string[];
  run: {
    status: ActiveRun["status"] | "none";
    ms?: number;
    executionId?: number;
    errors: ActiveRun["errors"];
  };
  connected: boolean;
  followChanges: boolean;
  // The global layout (Explorer, status bar, code pane, …). Not `layout`,
  // which ViewState already uses for Output's Cards/List.
  shellLayout: Layout;
};

export type SquiggleStudioApi = {
  version: 1;
  hasUnsavedChanges(): boolean; // Electron (existing)
  discardChanges(): void; // Electron (existing)
  flush(): Promise<void>; // autosave everything now
  commands: {
    list(): Array<{
      id: string;
      title: string;
      category: string;
      keys: string[];
      enabled: boolean;
      checked?: boolean;
    }>;
    run(
      id: string,
      args?: unknown
    ): Promise<{ ok: true } | { ok: false; error: string }>;
  };
  getState(): UiState;
  whenIdle(
    timeoutMs?: number
  ): Promise<{ idle: boolean; timedOut: boolean; waitedMs: number }>;
  getRunJson(): unknown; // RunJson | null (WP8's provider)
  getRvMatrix(opts?: { variable?: string }): Promise<unknown>; // RelativeValuesBundle | null (WP6's provider)
};

declare global {
  interface Window {
    squiggleStudio?: SquiggleStudioApi;
  }
}

// What the page's workspace knows (App passes getters).
export type WorkspaceProbe = {
  root(): string | undefined;
  dirtyFiles(): string[];
  conflicts(): string[];
  connected(): boolean;
  flush(): Promise<void>;
};

// Data providers for window.squiggleStudio; the last registered one wins.
export type AgentProviders = {
  getRunJson: () => unknown; // the shown file's last finished run as RunJson, or null
  getRvMatrix: (opts?: { variable?: string }) => unknown; // RelativeValuesBundle | null, or a promise of it
};

const providers: { [K in keyof AgentProviders]: AgentProviders[K][] } = {
  getRunJson: [],
  getRvMatrix: [],
};

export function registerAgentProvider<K extends keyof AgentProviders>(
  name: K,
  fn: AgentProviders[K]
): () => void {
  const list = providers[name] as AgentProviders[K][];
  list.push(fn);
  return () => {
    const index = list.lastIndexOf(fn);
    if (index !== -1) list.splice(index, 1);
  };
}

function provider<K extends keyof AgentProviders>(
  name: K
): AgentProviders[K] | undefined {
  const list = providers[name] as AgentProviders[K][];
  return list[list.length - 1];
}

export function getUiState(probe: WorkspaceProbe): UiState {
  const run = getActiveRun();
  return {
    ...getViewState(),
    root: probe.root(),
    host: host.kind,
    dirtyFiles: probe.dirtyFiles(),
    conflicts: probe.conflicts(),
    run: run
      ? {
          status: run.status,
          ms: run.ms,
          executionId: run.executionId,
          errors: run.errors,
        }
      : { status: "none", errors: [] },
    connected: probe.connected(),
    followChanges: getSettings()["squiggle.followChanges"],
    shellLayout: getFullLayout(),
  };
}

// Installs window.squiggleStudio. Returns an uninstall function. `discard`
// is called when the Electron shell's dialog already confirmed discarding
// unsaved edits (so beforeunload doesn't ask again).
export function installAgentHooks(
  probe: WorkspaceProbe,
  onDiscard: () => void
): () => void {
  const api: SquiggleStudioApi = {
    version: 1,
    hasUnsavedChanges: () => probe.dirtyFiles().length > 0,
    discardChanges: onDiscard,
    flush: () => probe.flush(),
    commands: {
      list: () =>
        listCommands().map(({ spec, enabled, checked, keys }) => ({
          id: spec.id,
          title: spec.title,
          category: spec.category,
          keys,
          enabled,
          ...(checked === undefined ? {} : { checked }),
        })),
      run: (id, args) => runCommandAsync(id, args, "api"),
    },
    getState: () => getUiState(probe),
    whenIdle: (timeoutMs) => whenIdle(timeoutMs),
    getRunJson: () => provider("getRunJson")?.() ?? null,
    getRvMatrix: async (opts) =>
      (await provider("getRvMatrix")?.(opts)) ?? null,
  };
  window.squiggleStudio = api;
  return () => {
    if (window.squiggleStudio === api) delete window.squiggleStudio;
  };
}
