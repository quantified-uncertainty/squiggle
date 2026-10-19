import { FC } from "react";

import {
  deleteEditorClipboardRanges,
  editorClipboardText,
  type EditorCommand,
  pasteIntoEditor,
  runEditorCommand,
} from "@quri/squiggle-components";
import { useToast } from "@quri/ui";

import {
  type EditorTarget,
  getEditorTarget,
  useEditorAvailability,
} from "../lib/activeEditor.js";
import { useActiveRun } from "../lib/stores/activeRun.js";
import { updateSettings, useSetting } from "../lib/studioState.js";
import { useContextKeys } from "./context.js";
import { primaryKeyLabel } from "../components/Kbd.js";
import { useCommand } from "./registry.js";

// The Edit menu through the components' editor bridge (§3.4 Edit, §4.7), Run
// ▸ Auto-run, and the context keys hasEditor, hasCodeEditor, running,
// runFinished, hasErrors and autorun (§4.4). Always mounted (App).
//
// The commands act on the last focused editor in the main area (activeEditor.ts).
// Menus restore focus before they run a command, so Cut, Copy and Paste first
// act on whatever has focus (an input, the palette's field) and fall back to
// that editor.

function isEditable(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) {
    return !el.readOnly && !["button", "checkbox", "radio"].includes(el.type);
  }
  return el.isContentEditable;
}

// Focus where a clipboard or select-all command should act: the focused
// editable element, else the editor target (focused first).
function focusForEditing(target: EditorTarget | undefined): boolean {
  if (isEditable(document.activeElement)) return true;
  if (!target) return false;
  focusTarget(target);
  return true;
}

function focusTarget(target: EditorTarget): void {
  if (target.kind === "text") {
    target.element.focus();
  } else {
    target.element.querySelector<HTMLElement>(".cm-content")?.focus();
  }
}

// An editor command on the target editor; the textarea gets the browser's
// built-in undo, redo and select-all.
function editorCommand(cmd: EditorCommand): boolean {
  const target = getEditorTarget();
  if (!target) return false;
  if (target.kind === "text") {
    focusTarget(target);
    if (cmd === "undo" || cmd === "redo") {
      return document.execCommand(cmd);
    }
    if (cmd === "selectAll") {
      target.element.select();
      return true;
    }
    return false; // find, replace, comment and format need a code editor
  }
  const ok = runEditorCommand(target.element, cmd);
  // The search panel focuses its own field; everything else edits the code.
  if (cmd !== "find" && cmd !== "replace") focusTarget(target);
  return ok;
}

export const EditorCommands: FC = () => {
  const toast = useToast();
  const { hasEditor, hasCodeEditor } = useEditorAvailability();
  const autorun = useSetting("squiggle.autorun");
  const run = useActiveRun();

  useContextKeys({
    hasEditor,
    hasCodeEditor,
    autorun,
    running: run?.status === "running",
    runFinished: run !== undefined && run.status !== "running",
    hasErrors: (run?.errors.length ?? 0) > 0,
  });

  useCommand("undo", () => {
    editorCommand("undo");
  });
  useCommand("redo", () => {
    editorCommand("redo");
  });
  useCommand("editor.action.selectAll", () => {
    const target = getEditorTarget();
    const active = document.activeElement;
    if (
      isEditable(active) &&
      !(target && target.element.contains(active)) &&
      (active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement)
    ) {
      active.select();
      return;
    }
    if (target) {
      editorCommand("selectAll");
      return;
    }
    document.execCommand("selectAll");
  });

  // "press ⌘X" for when the browser refuses (no clipboard API, permission
  // denied).
  const pressInstead = (
    verb: string,
    command:
      | "editor.action.clipboardCutAction"
      | "editor.action.clipboardCopyAction"
      | "editor.action.clipboardPasteAction",
    fallback: string
  ) =>
    toast(
      `Your browser blocks ${verb} from menus; press ${primaryKeyLabel(command) ?? fallback}`,
      "error"
    );

  // Cut and Copy. A focused input or textarea uses the browser's own
  // commands (inside the click's user activation: menus run on the next
  // frame). CodeMirror can't (in Chrome it edits through EditContext, which
  // execCommand doesn't reach), so its text goes through the async clipboard
  // API and the components' bridge (§4.7) edits the document.
  const clipboard = async (action: "cut" | "copy") => {
    focusForEditing(getEditorTarget());
    const code = document.activeElement?.closest(".cm-editor");
    if (!code) {
      document.execCommand(action);
      return;
    }
    const text = editorClipboardText(code);
    if (text === undefined) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Copy can still go through the copy event CodeMirror handles.
      if (action === "copy" && document.execCommand("copy")) return;
      pressInstead(
        action === "cut" ? "cutting" : "copying",
        action === "cut"
          ? "editor.action.clipboardCutAction"
          : "editor.action.clipboardCopyAction",
        action === "cut" ? "⌘X" : "⌘C"
      );
      return;
    }
    if (action === "cut") deleteEditorClipboardRanges(code);
  };
  useCommand("editor.action.clipboardCutAction", () => clipboard("cut"));
  useCommand("editor.action.clipboardCopyAction", () => clipboard("copy"));

  // Paste: navigator.clipboard.readText(), inserted at the selection (§3.4);
  // the "blocked" toast only when the browser refuses to read.
  useCommand("editor.action.clipboardPasteAction", async () => {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      pressInstead("pasting", "editor.action.clipboardPasteAction", "⌘V");
      return;
    }
    if (!focusForEditing(getEditorTarget())) return;
    const code = document.activeElement?.closest(".cm-editor");
    if (code) {
      pasteIntoEditor(code, text);
      return;
    }
    // Inputs and the text-file textarea take it as typing (undoable).
    if (!document.execCommand("insertText", false, text)) {
      toast("Couldn't paste here", "error");
    }
  });

  useCommand("actions.find", () => {
    editorCommand("find");
  });
  useCommand("editor.action.startFindReplaceAction", () => {
    editorCommand("replace");
  });
  useCommand("editor.action.commentLine", () => {
    editorCommand("toggleComment");
  });
  useCommand("editor.action.formatDocument", () => {
    editorCommand("format");
  });

  useCommand(
    "squiggle.toggleAutorun",
    () => updateSettings({ "squiggle.autorun": !autorun }),
    { checked: autorun }
  );

  return null;
};
