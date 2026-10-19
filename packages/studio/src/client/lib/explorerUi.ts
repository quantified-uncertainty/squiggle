// Explorer UI state shared by ExplorerCommands (always mounted) and the
// Explorer (mounted while visible), plus the pure helpers behind the inline
// name input and the tree's keys (§3.9, §5.3).
//
// - The tree's cursor, so commands run from a menu or the palette ("New File
//   here", "Rename") know the row the user was on.
// - The pending inline name input (one at a time: a second request replaces
//   the first, so inputs never pile up, #16).
// - The open Explorer modal (Open Folder, Hub import), rendered by
//   ExplorerCommands so the commands work with the Explorer hidden.
// - Reveal requests (Reveal Active File in Explorer, rename from the menu).

import { useSyncExternalStore } from "react";

import {
  bindingsFor,
  type CommandSpec,
  getCommand,
  type Host,
  type KeyEventLike,
  keyForPlatform,
  parseKey,
  type Platform,
  strokeFromEvent,
  strokesEqual,
} from "../../shared/commands/index.js";
import {
  basename,
  dirname,
  extname,
  isSupportedPath,
  normalizeRelPath,
  withDefaultExtension,
} from "../../shared/paths.js";

// ── Names (#8, #39) ─────────────────────────────────────────────────────────

export const NAME_MESSAGES = {
  unsupported: "Studio edits .squiggle, .json and .md files",
  exists: (path: string) => `${path} already exists`,
} as const;

export type NameResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

// The canonical path for a name typed into the inline input, or why it can't
// be used. Typed names go through normalizeRelPath (`./x`, `a//b`, `a\b` and
// `m/./n` become canonical; `..`, hidden segments and an empty last segment
// are refused). A name without an extension gets `.squiggle` when creating
// and the source file's extension when renaming (README → README.md).
export function resolveNameInput(
  input: string,
  opts: { mode: "create" } | { mode: "rename"; from: string }
): NameResult {
  const normalized = normalizeRelPath(input);
  if (!normalized.ok) return normalized;
  const ext =
    opts.mode === "rename" ? extname(opts.from) || ".squiggle" : ".squiggle";
  const path = withDefaultExtension(normalized.path, ext);
  if (!isSupportedPath(path)) {
    return { ok: false, error: NAME_MESSAGES.unsupported };
  }
  return { ok: true, path };
}

// `dir/name`, or `name` at the root.
export function joinDir(dir: string, name: string): string {
  return dir ? `${dir}/${name}` : name;
}

// The first of `stem<ext>`, `stem-1<ext>`, `stem-2<ext>`, … in `dir` that
// isn't taken (a file or folder path).
export function freeName(
  taken: ReadonlySet<string>,
  dir: string,
  stem: string,
  ext = ""
): string {
  for (let n = 0; ; n++) {
    const name = n === 0 ? `${stem}${ext}` : `${stem}-${n}${ext}`;
    if (!taken.has(joinDir(dir, name))) return name;
  }
}

// What the inline input starts with: its value and the selected range.
export type NameDraft = { value: string; selection: [number, number] };

// New File…: `<dir>/untitled.squiggle` (the first free untitled-N), with only
// "untitled" selected.
export function newFileDraft(
  taken: ReadonlySet<string>,
  dir: string
): NameDraft {
  const name = freeName(taken, dir, "untitled", ".squiggle");
  const value = joinDir(dir, name);
  const start = value.length - name.length;
  return {
    value,
    selection: [start, start + name.length - ".squiggle".length],
  };
}

// New Folder…: `<dir>/new-folder/untitled.squiggle` with "new-folder"
// selected (empty folders aren't listed, so a folder starts with its first
// model).
export function newFolderDraft(
  taken: ReadonlySet<string>,
  dir: string
): NameDraft {
  const folder = freeName(taken, dir, "new-folder");
  const prefix = joinDir(dir, folder);
  const start = prefix.length - folder.length;
  return {
    value: `${prefix}/untitled.squiggle`,
    selection: [start, prefix.length],
  };
}

// Rename…: the file's path with its name (without the extension) selected.
export function renameDraft(path: string): NameDraft {
  const name = basename(path);
  const ext = extname(path);
  const start = path.length - name.length;
  return { value: path, selection: [start, path.length - ext.length] };
}

// The folder a new file goes into: the cursor's folder (the cursor itself
// when it is a folder), else the shown file's folder, else the root.
export function targetDir(
  cursor: { path: string; kind: "file" | "dir" } | undefined,
  activePath: string | null
): string {
  if (cursor) return cursor.kind === "dir" ? cursor.path : dirname(cursor.path);
  return activePath ? dirname(activePath) : "";
}

// A starter model for a new .squiggle file.
export function newFileTemplate(path: string): string {
  if (!path.endsWith(".squiggle")) return "";
  return `// ${basename(path)}\n\n@name("Estimate")\nestimate = 1 to 10\n`;
}

// "~/models" style display of an absolute folder path (macOS and Linux
// homes), for menus and lists.
export function displayFolderPath(path: string): string {
  return path
    .replace(/^\/(Users|home)\/[^/]+(?=\/|$)/, "~")
    .replace(/(.)[\\/]+$/, "$1");
}

// The last segment of an absolute folder path ("/a/b/models" → "models").
export function folderName(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "").replace(/\\/g, "/");
  return basename(trimmed) || trimmed;
}

// The folder containing an absolute folder path, for display.
export function folderParent(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "").replace(/\\/g, "/");
  return displayFolderPath(dirname(trimmed) || "/");
}

// ── Tree keys ──────────────────────────────────────────────────────────────

// Commands the tree's own onKeyDown handles (owner "region", plus Esc's
// squiggle.focusMain): bare keys, which the global dispatcher never takes.
export const TREE_KEY_COMMANDS = [
  "list.focusUp",
  "list.focusDown",
  "list.expand",
  "list.collapse",
  "list.focusFirst",
  "list.focusLast",
  "list.focusPageUp",
  "list.focusPageDown",
  "explorer.openAndPassFocus",
  "filesExplorer.openFilePreserveFocus",
  "squiggle.focusMain",
] as const;

export type TreeKeyCommand = (typeof TREE_KEY_COMMANDS)[number];

// The tree command a keydown maps to, from the manifest's bindings (so the
// shortcut sheet and the tree agree).
export function treeKeyCommand(
  e: KeyEventLike,
  platform: Platform,
  host: Host
): { id: TreeKeyCommand; spec: CommandSpec } | undefined {
  const stroke = strokeFromEvent(e, platform);
  if (!stroke) return undefined;
  for (const id of TREE_KEY_COMMANDS) {
    const spec = getCommand(id);
    if (!spec) throw new Error(`The manifest has no ${id}`);
    for (const binding of bindingsFor(spec, platform, host)) {
      const key = keyForPlatform(binding, platform);
      if (!key) continue;
      const strokes = parseKey(key);
      if (strokes.length === 1 && strokesEqual(strokes[0], stroke)) {
        return { id, spec };
      }
    }
  }
  return undefined;
}

// ── The UI store ───────────────────────────────────────────────────────────

export type NameInputRequest = (
  | { mode: "create"; kind: "file" | "folder"; dir: string }
  | { mode: "rename"; from: string }
) &
  NameDraft & {
    // Puts focus back where it was before the input opened (cancel, rename).
    restoreFocus?: () => void;
  };

export type ExplorerModal = "open-folder" | "hub-import";

export type ExplorerUiState = {
  cursor: string | null; // the tree's cursor (a file or folder path)
  input: (NameInputRequest & { id: number }) | null;
  modal: ExplorerModal | null;
  // Reveal `path` (expand its ancestors, scroll it into view, move the
  // cursor there); `seq` makes repeated requests for one path distinct.
  reveal: { path: string; seq: number } | null;
};

let state: ExplorerUiState = {
  cursor: null,
  input: null,
  modal: null,
  reveal: null,
};
let nextId = 1;
const listeners = new Set<() => void>();

function update(patch: Partial<ExplorerUiState>) {
  state = { ...state, ...patch };
  for (const cb of [...listeners]) cb();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getExplorerUi(): ExplorerUiState {
  return state;
}

// `select` should return a part of the state (not a new object).
export function useExplorerUi<T>(select: (s: ExplorerUiState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state)
  );
}

export function setCursor(path: string | null): void {
  if (state.cursor !== path) update({ cursor: path });
}

export function startNameInput(request: NameInputRequest): void {
  update({ input: { ...request, id: nextId++ } });
}

// Ends the input with this id (a newer request is left alone).
export function endNameInput(id: number): void {
  if (state.input?.id === id) update({ input: null });
}

export function openExplorerModal(modal: ExplorerModal): void {
  update({ modal });
}

export function closeExplorerModal(): void {
  if (state.modal !== null) update({ modal: null });
}

export function requestReveal(path: string): void {
  update({ reveal: { path, seq: nextId++ }, cursor: path });
}

// The tree handled the request (so a remounted tree doesn't repeat it).
export function consumeReveal(seq: number): void {
  if (state.reveal?.seq === seq) update({ reveal: null });
}

// For tests.
export function resetExplorerUiForTests(): void {
  state = { cursor: null, input: null, modal: null, reveal: null };
  listeners.clear();
}
