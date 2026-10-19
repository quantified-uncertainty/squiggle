// State of the relative values view (WP6), shared by the view and its toolbar
// in the editor header (two React subtrees):
//
// - which files have specs (keeps the view for a spec with a mistake, #30);
// - the per-file UI state: the shown spec and tab, persisted in the root's
//   state (`relativeValues:<path>`, §2.2) with the URL as initial state only
//   (#17);
// - the pair caches, keyed by SqProject, spec and semantic key (#15).

import { useSyncExternalStore } from "react";
import { z } from "zod";

import type { SqModuleOutput, SqProject } from "@quri/squiggle-lang";
import {
  findRelativeValuesExports,
  InMemoryRelativeValuesCache,
  type RelativeValuesExport,
} from "@quri/squiggle-relative-values";

import type { ViewState } from "../../../shared/viewState.js";
import { readStorage } from "../../lib/storage.js";
import {
  getRootState,
  isRootStateLoaded,
  setRootState,
} from "../../lib/studioState.js";
import type { StudioRunOutput } from "../types.js";

// ── Specs ───────────────────────────────────────────────────────────────────

// `isAvailable` runs on every render, so detection is memoized per run.
const exportsByOutput = new WeakMap<SqModuleOutput, RelativeValuesExport[]>();

export function getRelativeValuesExports(
  output: SqModuleOutput
): RelativeValuesExport[] {
  let found = exportsByOutput.get(output);
  if (!found) {
    found = findRelativeValuesExports(output);
    exportsByOutput.set(output, found);
  }
  return found;
}

// Per file, the names of the bindings that held a spec in the latest run that
// had any. The view stays available while the model is broken (a syntax error
// in the middle of an edit) and while one of these bindings still exists but
// no longer looks like a spec (e.g. `fruit = 3` mid-edit): the view then says
// so, instead of jumping to another view (#30).
const specBindings = new Map<string, readonly string[]>();

export function hasRelativeValues(
  filePath: string,
  runOutput: StudioRunOutput | undefined
): boolean {
  if (!runOutput || !runOutput.output.result.ok) {
    return specBindings.has(filePath);
  }
  const found = getRelativeValuesExports(runOutput.output);
  if (found.length > 0) {
    specBindings.set(
      filePath,
      found.map((f) => f.name)
    );
    return true;
  }
  return formerSpecs(filePath, runOutput.output).length > 0;
}

// Bindings of `output` that held a spec before but don't look like one now.
// Forgets the file once none of them exists.
export function formerSpecs(
  filePath: string,
  output: SqModuleOutput
): string[] {
  const names = specBindings.get(filePath);
  if (!names) return [];
  const bindings = output.getBindings();
  if (!bindings.ok) return [...names];
  const remaining = names.filter((name) => bindings.value.get(name));
  if (remaining.length === 0) specBindings.delete(filePath);
  return remaining;
}

// The spec to show: the file's chosen one, else the first. In embed mode
// (`render --variable`) an unknown name is an error, reported by the view.
export function selectSpec(
  found: readonly RelativeValuesExport[],
  variable: string | undefined
): RelativeValuesExport | undefined {
  return found.find((f) => f.name === variable) ?? found[0];
}

// ── Pair caches ─────────────────────────────────────────────────────────────

// Per project (a project lives until the file's imports change on disk) and
// per (spec, semantic key): re-renders, tab switches, comment edits and
// returning to an earlier version (e.g. undo) reuse computed pairs.
const MAX_CACHES_PER_PROJECT = 20;
const cachesByProject = new WeakMap<
  SqProject,
  Map<string, InMemoryRelativeValuesCache>
>();

export function getPairCache(
  project: SqProject,
  variable: string,
  semanticKey: string
): InMemoryRelativeValuesCache {
  let caches = cachesByProject.get(project);
  if (!caches) {
    caches = new Map();
    cachesByProject.set(project, caches);
  }
  const key = `${variable}\0${semanticKey}`;
  let cache = caches.get(key);
  if (cache) {
    // Map preserves insertion order; move to the end (most recently used).
    caches.delete(key);
  } else {
    cache = new InMemoryRelativeValuesCache();
  }
  caches.set(key, cache);
  while (caches.size > MAX_CACHES_PER_PROJECT) {
    caches.delete(caches.keys().next().value as string);
  }
  return cache;
}

// ── UI state per file ───────────────────────────────────────────────────────

export const rvTabSchema = z.enum(["list", "grid", "plot"]);
export type RvTab = z.infer<typeof rvTabSchema>;
export const RV_TABS: readonly { id: RvTab; label: string }[] = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
  { id: "plot", label: "Plot" },
];
export const DEFAULT_RV_TAB: RvTab = "list";

const rvFileStateSchema = z.object({
  variable: z.string().optional(), // the spec's binding name
  tab: rvTabSchema.optional(),
});
export type RvFileState = z.infer<typeof rvFileStateSchema>;

const rootStateKey = (path: string) => `relativeValues:${path}`;
// Before the root's state store has loaded (until WP4 loads it), and for
// state saved by earlier versions.
const legacyKey = (path: string) => `squiggle-studio:relative-values:${path}`;

// This page's copy, the source of truth while the page lives.
const memory = new Map<string, RvFileState>();
// Files whose URL initial state was applied (once per page, #17).
const initialApplied = new Set<string>();
const listeners = new Set<() => void>();

const memoryKey = (root: string | undefined, path: string) =>
  `${root ?? ""}\0${path}`;

function persisted(root: string | undefined, path: string): RvFileState {
  if (root !== undefined && isRootStateLoaded(root)) {
    const saved = getRootState(
      root,
      rootStateKey(path),
      rvFileStateSchema.optional(),
      undefined
    );
    if (saved) return saved;
  }
  return readStorage(legacyKey(path), rvFileStateSchema) ?? {};
}

function writePersisted(
  root: string | undefined,
  path: string,
  state: RvFileState
) {
  if (root !== undefined && isRootStateLoaded(root)) {
    setRootState(root, rootStateKey(path), state);
  } else {
    try {
      window.localStorage.setItem(legacyKey(path), JSON.stringify(state));
    } catch {
      // Private windows and blocked storage: this page's copy only.
    }
  }
}

export function getRvFileState(
  root: string | undefined,
  path: string
): RvFileState {
  const key = memoryKey(root, path);
  let state = memory.get(key);
  if (!state) {
    state = persisted(root, path);
    memory.set(key, state);
  }
  return state;
}

export function updateRvFileState(
  root: string | undefined,
  path: string,
  patch: Partial<RvFileState>
): void {
  const current = getRvFileState(root, path);
  const next: RvFileState = { ...current, ...patch };
  if (next.variable === current.variable && next.tab === current.tab) return;
  memory.set(memoryKey(root, path), next);
  writePersisted(root, path, next);
  for (const cb of [...listeners]) cb();
}

// The URL's tab and spec for the `?file=` file, applied once per page on top
// of the saved state, without saving them: they are a starting point, and the
// user's choices win from then on (#17).
function applyInitialOnce(
  root: string | undefined,
  path: string,
  initial: ViewState | undefined
) {
  const key = memoryKey(root, path);
  if (!initial || initialApplied.has(key)) return;
  initialApplied.add(key);
  const state = getRvFileState(root, path);
  memory.set(key, {
    ...state,
    ...(initial.tab !== undefined && { tab: initial.tab }),
    ...(initial.variable !== undefined && { variable: initial.variable }),
  });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// The file's state and its setter. In embed mode (`render`) the URL is
// authoritative: the state is the URL's tab and spec, nothing else.
export function useRvFileState(
  root: string | undefined,
  path: string,
  opts: { initial: ViewState | undefined; embed: boolean }
): [RvFileState, (patch: Partial<RvFileState>) => void] {
  const { initial, embed } = opts;
  if (!embed) applyInitialOnce(root, path, initial);
  const state = useSyncExternalStore(
    subscribe,
    () => getRvFileState(root, path),
    () => getRvFileState(root, path)
  );
  const embedState: RvFileState = embed
    ? { tab: initial?.tab, variable: initial?.variable }
    : state;
  return [embedState, (patch) => updateRvFileState(root, path, patch)];
}

// For tests.
export function resetRvStateForTests(): void {
  memory.clear();
  initialApplied.clear();
  specBindings.clear();
}
