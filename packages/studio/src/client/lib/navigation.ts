// Navigation history (§2.4): the only code that writes `window.history`.
//
// WP0 stub (owned by WP4): both writers call replaceState with the merged
// ViewState, so the address bar always encodes the current view (#17) and a
// reload restores it. WP4 adds pushState for recorded navigations, arrow-key
// coalescing, idx / canGoBack / canGoForward and popstate.
// Embed mode (`?embed=1`, used by `render`) never writes history.

import {
  urlFlagsFromSearch,
  type ViewState,
  viewStateToSearch,
} from "../../shared/viewState.js";
import type { OpenReason } from "./workspaceTypes.js";

const flags =
  typeof window === "undefined"
    ? {}
    : urlFlagsFromSearch(window.location.search);
const embed = flags.embed === "1";

let current: ViewState = {};
const restoreListeners = new Set<(state: ViewState) => void>();

function write() {
  if (embed || typeof window === "undefined") return;
  const search = viewStateToSearch(current, flags);
  const url = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState({ studio: 1, idx: 0, ...current }, "", url);
}

// A navigation to another file (or another view of the shown file). Another
// file resets in-file state (tab, layout, variable, code, line); re-opening
// the shown file keeps it.
export function recordNavigation(
  state: { file: string; view?: string },
  reason: OpenReason
): void {
  void reason; // WP4: "tree-arrow" opens coalesce, "history" doesn't record
  if (state.file === current.file) {
    if (state.view) current = { ...current, view: state.view };
  } else {
    current = { file: state.file, ...(state.view ? { view: state.view } : {}) };
  }
  write();
}

// In-file state (Cards/List, RV tab, code pane, view): always replaceState.
export function updateViewState(patch: Partial<ViewState>): void {
  const next: ViewState = { ...current, ...patch };
  for (const key of Object.keys(next) as (keyof ViewState)[]) {
    if (next[key] === undefined) delete next[key];
  }
  current = next;
  write();
}

// No file shown (start page): the address bar has no view parameters.
export function clearViewState(): void {
  current = {};
  write();
}

// The ViewState the address bar shows (Copy Link, agents).
export function getViewState(): ViewState {
  return current;
}

// popstate → Workspace (WP4). The stub never calls it.
export function onHistoryRestore(cb: (state: ViewState) => void): () => void {
  restoreListeners.add(cb);
  return () => {
    restoreListeners.delete(cb);
  };
}
