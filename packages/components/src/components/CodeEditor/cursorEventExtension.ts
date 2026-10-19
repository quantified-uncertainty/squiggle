import { Extension } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

// Reports the cursor as a DOM event, so that an app can show "Ln 12, Col 5"
// for any editor on the page, including ones it can't reach by ref (such as
// the playground's): a bubbling `CustomEvent("sq-editor-cursor")` from the
// editor's root element, at most once per animation frame, when the editor is
// created and whenever the selection or the document changes.

export const SQ_EDITOR_CURSOR_EVENT = "sq-editor-cursor";

export type EditorCursorDetail = {
  line: number; // 1-based line of the main selection's head
  column: number; // 1-based column (UTF-16 code units from the line start)
  selected: number; // selected characters over all ranges; 0 for a plain cursor
};

export function editorCursorDetail(view: EditorView): EditorCursorDetail {
  const { selection, doc } = view.state;
  const head = selection.main.head;
  const line = doc.lineAt(head);
  const selected = selection.ranges.reduce(
    (sum, range) => sum + (range.to - range.from),
    0
  );
  return { line: line.number, column: head - line.from + 1, selected };
}

const schedule: (fn: () => void) => () => void =
  typeof requestAnimationFrame === "function"
    ? (fn) => {
        const id = requestAnimationFrame(fn);
        return () => cancelAnimationFrame(id);
      }
    : (fn) => {
        const id = setTimeout(fn, 16);
        return () => clearTimeout(id);
      };

export function cursorEventExtension(): Extension {
  return ViewPlugin.fromClass(
    class {
      private cancel: (() => void) | undefined;

      constructor(private view: EditorView) {
        this.request();
      }

      update(update: ViewUpdate) {
        if (update.selectionSet || update.docChanged) this.request();
      }

      destroy() {
        this.cancel?.();
        this.cancel = undefined;
      }

      private request(attempt = 0) {
        if (this.cancel) return;
        this.cancel = schedule(() => {
          this.cancel = undefined;
          // A new editor's DOM is attached by React a little later; an event
          // from a detached element would reach no listener.
          if (!this.view.dom.isConnected) {
            if (attempt < 60) this.request(attempt + 1);
            return;
          }
          this.view.dom.dispatchEvent(
            new CustomEvent<EditorCursorDetail>(SQ_EDITOR_CURSOR_EVENT, {
              bubbles: true,
              detail: editorCursorDetail(this.view),
            })
          );
        });
      }
    }
  );
}
