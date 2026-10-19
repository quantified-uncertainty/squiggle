import { FC } from "react";

import {
  type EditorCommand,
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

  // Inside the click's user activation (menus run on the next frame), so the
  // browser allows them.
  const clipboard = (action: "cut" | "copy") => {
    focusForEditing(getEditorTarget());
    document.execCommand(action);
  };
  useCommand("editor.action.clipboardCutAction", () => clipboard("cut"));
  useCommand("editor.action.clipboardCopyAction", () => clipboard("copy"));
  useCommand("editor.action.clipboardPasteAction", async () => {
    const blocked = () =>
      toast(
        `Your browser blocks pasting from menus; press ${primaryKeyLabel("editor.action.clipboardPasteAction") ?? "⌘V"}`,
        "error"
      );
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      blocked();
      return;
    }
    if (!focusForEditing(getEditorTarget())) return;
    // CodeMirror and textareas both take inserted text as typing (undoable).
    if (!document.execCommand("insertText", false, text)) blocked();
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
