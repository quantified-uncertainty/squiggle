// Navigation history (§2.4): the only code that writes `window.history`.
//
// - One entry per navigation {file, view}: the shown file changes, or the
//   shown file's view changes. Entries live in the browser's session history
//   (`pushState`), so the browser's Back button, the mouse back button and
//   ⌘[ work too; `popstate` restores the file and view without recording.
// - Each entry's state is `{studio: 1, idx, arrow?, …ViewState}`. Studio's
//   Back is enabled while `idx > 0` and Forward while `idx < maxIdx` (reset on
//   push), so Studio's own Back never leaves Studio.
// - Explorer arrow-key opens coalesce: when the current entry was itself
//   created by an arrow-key open, the next one replaces it, so walking ↓
//   through ten files records one entry.
// - In-file state (Cards/List, RV tab, code pane) uses replaceState, so the
//   address bar always encodes the current view (#17) without adding entries.
// - Embed mode (`?embed=1`, used by `render`) never writes history.

import {
  urlFlagsFromSearch,
  type ViewState,
  viewStateFromSearch,
  viewStateSchema,
  viewStateToSearch,
} from "../../shared/viewState.js";
import type { OpenReason } from "./workspaceTypes.js";

type Entry = ViewState & { studio: 1; idx: number; arrow?: boolean };

export type HistoryFlags = { canGoBack: boolean; canGoForward: boolean };

const MAX_IDX_KEY = "squiggle-studio:history-max";

let flags: ReturnType<typeof urlFlagsFromSearch> = {};
let embed = false;
let current: ViewState = {};
let idx = 0;
let maxIdx = 0;
let currentIsArrow = false;
let historyFlags: HistoryFlags = { canGoBack: false, canGoForward: false };
const restoreListeners = new Set<(state: ViewState) => void>();
const flagListeners = new Set<() => void>();
let installed = false;

function isEntry(value: unknown): value is Entry {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { studio?: unknown }).studio === 1 &&
    typeof (value as { idx?: unknown }).idx === "number"
  );
}

function viewStateOf(entry: Entry): ViewState {
  const parsed = viewStateSchema.safeParse(entry);
  return parsed.success ? parsed.data : {};
}

function readMaxIdx(): number {
  try {
    const raw = window.sessionStorage.getItem(MAX_IDX_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeMaxIdx() {
  try {
    window.sessionStorage.setItem(MAX_IDX_KEY, String(maxIdx));
  } catch {
    // Private windows: Forward after a reload is unknown; that's fine.
  }
}

function updateFlags() {
  const next = { canGoBack: idx > 0, canGoForward: idx < maxIdx };
  if (
    next.canGoBack === historyFlags.canGoBack &&
    next.canGoForward === historyFlags.canGoForward
  ) {
    return;
  }
  historyFlags = next;
  for (const cb of [...flagListeners]) cb();
}

function onPopState(e: PopStateEvent) {
  if (isEntry(e.state)) {
    idx = e.state.idx;
    currentIsArrow = e.state.arrow === true;
    current = viewStateOf(e.state);
  } else {
    // An entry Studio didn't create (e.g. a hash change): read the URL.
    current = viewStateFromSearch(window.location.search);
  }
  maxIdx = Math.max(maxIdx, idx);
  writeMaxIdx();
  updateFlags();
  for (const cb of [...restoreListeners]) cb(current);
}

// Reads the current entry and starts listening for popstate. Runs on import
// in the browser; tests call it again after resetNavigationForTests().
export function installNavigation(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  flags = urlFlagsFromSearch(window.location.search);
  embed = flags.embed === "1";
  const state: unknown = window.history.state;
  if (isEntry(state)) {
    idx = state.idx;
    currentIsArrow = state.arrow === true;
    current = viewStateOf(state);
    // A reload or a back/forward to this entry: the forward entries Studio
    // pushed are still there.
    maxIdx = Math.max(idx, readMaxIdx());
  } else {
    // A fresh navigation to this document (a link, a pasted URL): it starts
    // a new entry, which drops every forward entry, so the max index stored
    // by the previous document in this tab no longer applies.
    idx = 0;
    currentIsArrow = false;
    current = viewStateFromSearch(window.location.search);
    maxIdx = 0;
    writeMaxIdx();
  }
  historyFlags = { canGoBack: idx > 0, canGoForward: idx < maxIdx };
  window.addEventListener("popstate", onPopState);
}

function write(mode: "push" | "replace") {
  if (embed || typeof window === "undefined") return;
  const search = viewStateToSearch(current, flags);
  const url = `${window.location.pathname}${search}${window.location.hash}`;
  const entry: Entry = {
    ...current,
    studio: 1,
    idx,
    ...(currentIsArrow ? { arrow: true } : {}),
  };
  if (mode === "push") window.history.pushState(entry, "", url);
  else window.history.replaceState(entry, "", url);
  writeMaxIdx();
  updateFlags();
}

function push(next: ViewState, arrow: boolean) {
  current = next;
  currentIsArrow = arrow;
  idx += 1;
  maxIdx = idx; // pushing drops the forward entries
  write("push");
}

function replace(next: ViewState, arrow = currentIsArrow) {
  current = next;
  currentIsArrow = arrow;
  write("replace");
}

// A navigation: another file is shown, or another view of the shown file.
// Another file resets the in-file state (tab, layout, variable, code, line).
// `reason: "history"` is a popstate restore and records nothing.
export function recordNavigation(
  state: { file: string; view?: string },
  reason: OpenReason
): void {
  installNavigation();
  if (reason === "history") return;
  if (state.file === current.file) {
    if (!state.view || state.view === current.view) return;
    if (current.view === undefined) {
      // The view wasn't known yet (the file just opened): not a navigation.
      replace({ ...current, view: state.view });
      return;
    }
    const next: ViewState = { ...current, view: state.view };
    delete next.tab; // the RV tab belongs to the RV view
    delete next.variable;
    delete next.line;
    push(next, false);
    return;
  }
  const next: ViewState = {
    file: state.file,
    ...(state.view ? { view: state.view } : {}),
  };
  const arrow = reason === "tree-arrow";
  if (current.file === undefined) {
    // The first file shown in this entry (the start page has no entry of
    // its own).
    replace(next, arrow);
  } else if (arrow && currentIsArrow) {
    replace(next, true);
  } else {
    push(next, arrow);
  }
}

// In-file state (Cards/List, RV tab, code pane, the shown view): always
// replaceState.
export function updateViewState(patch: Partial<ViewState>): void {
  installNavigation();
  const next: ViewState = { ...current, ...patch };
  for (const key of Object.keys(next) as (keyof ViewState)[]) {
    if (next[key] === undefined) delete next[key];
  }
  replace(next);
}

// A Studio rename of the shown file: the current entry follows it.
export function renameInHistory(from: string, to: string): void {
  installNavigation();
  if (current.file === from) replace({ ...current, file: to });
}

// No file shown (start page): the address bar has no view parameters.
export function clearViewState(): void {
  installNavigation();
  replace({}, false);
}

// The ViewState the address bar shows (Copy Link, agents).
export function getViewState(): ViewState {
  installNavigation();
  return current;
}

export function getHistoryFlags(): HistoryFlags {
  installNavigation();
  return historyFlags;
}

export function subscribeHistory(cb: () => void): () => void {
  installNavigation();
  flagListeners.add(cb);
  return () => {
    flagListeners.delete(cb);
  };
}

export function goBack(): void {
  if (getHistoryFlags().canGoBack) window.history.back();
}

export function goForward(): void {
  if (getHistoryFlags().canGoForward) window.history.forward();
}

// popstate → Workspace (shows the entry's file and view).
export function onHistoryRestore(cb: (state: ViewState) => void): () => void {
  installNavigation();
  restoreListeners.add(cb);
  return () => {
    restoreListeners.delete(cb);
  };
}

// For tests.
export function resetNavigationForTests(): void {
  if (installed && typeof window !== "undefined") {
    window.removeEventListener("popstate", onPopState);
  }
  installed = false;
  current = {};
  idx = 0;
  maxIdx = 0;
  currentIsArrow = false;
  historyFlags = { canGoBack: false, canGoForward: false };
  restoreListeners.clear();
  flagListeners.clear();
  try {
    window.sessionStorage.removeItem(MAX_IDX_KEY);
  } catch {
    // ignore
  }
}

installNavigation();
