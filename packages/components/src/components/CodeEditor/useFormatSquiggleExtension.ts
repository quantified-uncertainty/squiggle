import { EditorView, keymap } from "@codemirror/view";
import * as prettier from "prettier/standalone";
import { useMemo } from "react";

import * as prettierSquigglePlugin from "@quri/prettier-plugin-squiggle/standalone";
import { astNodeIsEqual, parse } from "@quri/squiggle-lang";

export async function formatSquiggle(view: EditorView | undefined) {
  if (!view) return;
  const code = view.state.doc.toString();
  const before = parse(code);
  const { formatted, cursorOffset } = await prettier.formatWithCursor(code, {
    parser: "squiggle",
    plugins: [prettierSquigglePlugin],
    cursorOffset: view.state.selection.main.to,
  });
  const after = parse(formatted);
  if (before.ok !== after.ok) {
    console.error("ERROR!");
  } else if (before.ok && after.ok) {
    const isEqual = astNodeIsEqual(before.value, after.value, true);
    if (!isEqual) {
      console.error("ERROR!");
    } else {
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
  }
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
