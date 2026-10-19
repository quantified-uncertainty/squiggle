import { redo, selectAll, toggleComment, undo } from "@codemirror/commands";
import { openSearchPanel } from "@codemirror/search";
import { Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { formatSquiggle } from "./formatSquiggleExtension.js";

// The editor-command bridge (Studio v2 spec §4.7). Apps that embed CodeEditor
// (Squiggle Studio) must not import `@codemirror/*` themselves: a second copy
// of the packages breaks StateField identity, so their undo would find no
// history. They run editor commands through these functions instead, which use
// this package's own copy.
//
// Undo and redo through the browser's or Electron's native Edit menu arrive as
// `beforeinput` events with inputType "historyUndo" / "historyRedo"; the
// `history()` extension already handles those, so no extra handler is needed.

export type EditorCommand =
  | "undo"
  | "redo"
  | "selectAll"
  | "find"
  | "replace"
  | "toggleComment"
  | "format";

// The editor view that `target` belongs to: a `.cm-editor` element, its
// `.cm-content`, or any element inside an editor.
export function findEditorView(target: Element): EditorView | undefined {
  const root = target.closest(".cm-editor") ?? target;
  if (!(root instanceof HTMLElement)) return undefined;
  return EditorView.findFromDOM(root) ?? undefined;
}

// Runs `cmd` on the editor that `target` belongs to. Returns false when there
// is no editor there or the command didn't apply (e.g. nothing to undo).
export function runEditorCommand(target: Element, cmd: EditorCommand): boolean {
  const view = findEditorView(target);
  if (!view) return false;
  switch (cmd) {
    case "undo":
      return undo(view);
    case "redo":
      return redo(view);
    case "selectAll":
      return selectAll(view);
    case "toggleComment":
      return toggleComment(view);
    case "find":
      return openSearchPanel(view);
    case "replace": {
      // There's no command for "open with the replace field focused": open
      // the panel (it focuses the search field), then move to replace.
      openSearchPanel(view);
      const replace = view.dom.querySelector<HTMLInputElement>(
        ".cm-search input[name=replace]"
      );
      if (!replace) return false;
      replace.focus();
      replace.select();
      return true;
    }
    case "format":
      void formatSquiggle(view);
      return true;
    default:
      throw new Error(`Unknown editor command: ${cmd satisfies never}`);
  }
}

// The smallest single change that turns `doc` into `code`, from their common
// prefix and suffix; undefined when they are equal.
export function computeExternalChange(
  doc: string,
  code: string
): { from: number; to: number; insert: string } | undefined {
  if (doc === code) return undefined;
  const max = Math.min(doc.length, code.length);
  let start = 0;
  while (start < max && doc.charCodeAt(start) === code.charCodeAt(start)) {
    start++;
  }
  let docEnd = doc.length;
  let codeEnd = code.length;
  while (
    docEnd > start &&
    codeEnd > start &&
    doc.charCodeAt(docEnd - 1) === code.charCodeAt(codeEnd - 1)
  ) {
    docEnd--;
    codeEnd--;
  }
  return { from: start, to: docEnd, insert: code.slice(start, codeEnd) };
}

// Replaces the document with `code` (written by another program, e.g. a
// coding agent) in one transaction marked as remote and kept out of the undo
// history: the selection maps through the change (and is clamped), scroll,
// folds and focus stay, and undo still undoes the user's own edits, never the
// external change. Returns whether anything changed.
export function applyExternalChange(view: EditorView, code: string): boolean {
  const change = computeExternalChange(view.state.doc.toString(), code);
  if (!change) return false;
  view.dispatch({
    changes: change,
    annotations: [
      Transaction.remote.of(true),
      Transaction.addToHistory.of(false),
    ],
  });
  return true;
}
