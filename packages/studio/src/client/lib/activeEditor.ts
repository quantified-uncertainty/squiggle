// The editor that Edit-menu commands act on (§3.4 Edit): the last focused
// editor in the main area (the code pane's or the Playground's CodeMirror
// editor, or the text-file textarea) while it is still mounted and visible;
// otherwise the shown file's visible editor. `hasEditor` / `hasCodeEditor`
// (§4.4) say whether there is one, and whether it is a code editor.

import { useEffect, useState } from "react";

import { TID } from "../../shared/testIds.js";

export type EditorTarget =
  | { kind: "code"; element: HTMLElement } // a `.cm-editor`
  | { kind: "text"; element: HTMLTextAreaElement };

const MAIN_REGIONS =
  '[data-studio-region="editor"], [data-studio-region="view"]';
const TEXT_EDITOR = `textarea[data-testid="${TID.textEditor}"]`;

let lastFocused: WeakRef<HTMLElement> | undefined;

function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if (el.closest("[hidden]") || el.closest('[data-region-hidden="true"]')) {
    return false;
  }
  const check = (el as HTMLElement & { checkVisibility?: () => boolean })
    .checkVisibility;
  return typeof check === "function" ? check.call(el) : true;
}

// The editor element `el` belongs to, if it is an editor in the main area.
function editorOf(el: Element | null): HTMLElement | undefined {
  if (!el || !el.closest(MAIN_REGIONS)) return undefined;
  const code = el.closest<HTMLElement>(".cm-editor");
  if (code) return code;
  return el instanceof HTMLTextAreaElement && el.matches(TEXT_EDITOR)
    ? el
    : undefined;
}

function toTarget(el: HTMLElement): EditorTarget {
  return el instanceof HTMLTextAreaElement
    ? { kind: "text", element: el }
    : { kind: "code", element: el };
}

export function getEditorTarget(): EditorTarget | undefined {
  const last = lastFocused?.deref();
  if (last && isVisible(last)) return toTarget(last);
  if (typeof document === "undefined") return undefined;
  // The shown file's editor: the code pane's, then the Playground's, then the
  // text-file textarea.
  const candidates = [
    ...document.querySelectorAll<HTMLElement>(
      `[data-studio-region="editor"] .cm-editor, [data-studio-region="view"] .cm-editor, ${TEXT_EDITOR}`
    ),
  ];
  const visible = candidates.find(isVisible);
  return visible ? toTarget(visible) : undefined;
}

export type EditorAvailability = { hasEditor: boolean; hasCodeEditor: boolean };

function availability(): EditorAvailability {
  const target = getEditorTarget();
  return { hasEditor: !!target, hasCodeEditor: target?.kind === "code" };
}

// Tracks focus into editors and re-checks availability when the DOM changes
// (editors mount asynchronously, the code pane collapses with `hidden`), at
// most once per animation frame.
export function useEditorAvailability(): EditorAvailability {
  const [state, setState] = useState<EditorAvailability>(() => ({
    hasEditor: false,
    hasCodeEditor: false,
  }));

  useEffect(() => {
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const next = availability();
      setState((prev) =>
        prev.hasEditor === next.hasEditor &&
        prev.hasCodeEditor === next.hasCodeEditor
          ? prev
          : next
      );
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    const onFocusIn = (e: FocusEvent) => {
      const editor = editorOf(e.target instanceof Element ? e.target : null);
      if (editor) lastFocused = new WeakRef(editor);
      schedule();
    };
    document.addEventListener("focusin", onFocusIn, true);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["hidden", "data-region-hidden"],
    });
    update();
    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  return state;
}

// For tests.
export function resetActiveEditorForTests(): void {
  lastFocused = undefined;
}
