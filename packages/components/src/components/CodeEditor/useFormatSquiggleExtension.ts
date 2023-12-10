import { EditorView, keymap } from "@codemirror/view";
import * as prettier from "prettier/standalone";
import { useMemo } from "react";

import * as prettierSquigglePlugin from "@quri/prettier-plugin-squiggle/standalone";

export async function formatSquiggle(view: EditorView | undefined) {
  if (!view) return;
  const code = view.state.doc.toString();
  const { formatted, cursorOffset } = await prettier.formatWithCursor(code, {
    parser: "squiggle",
    plugins: [prettierSquigglePlugin],
    cursorOffset: view.state.selection.main.to,
  });
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: formatted,
    },
    selection: {
      anchor: cursorOffset,
    },
  });
}

export function useFormatSquiggleExtension() {
  return useMemo(
    () =>
      keymap.of([
        {
          key: "Alt-Shift-f",
          run: (view) => {
            formatSquiggle(view);
            return true;
          },
        },
      ]),
    []
  );
}
