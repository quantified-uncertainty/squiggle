import "@testing-library/jest-dom";

import { EditorView } from "@codemirror/view";
import { act, render, waitFor } from "@testing-library/react";
import { createRef } from "react";

import { SqProject } from "@quri/squiggle-lang";

import {
  CodeEditor,
  type CodeEditorHandle,
  type EditorCursorDetail,
  type EditorStateSnapshot,
  runEditorCommand,
  SQ_EDITOR_CURSOR_EVENT,
} from "../src/index.js";

// The editor bridge (Studio v2 spec §4.7): apps run editor commands and take
// external changes through these APIs, never through their own @codemirror/*.

const CODE = "a = 1\nb = 2\nc = 3\n";

async function renderEditor(opts: {
  code?: string;
  initialState?: EditorStateSnapshot;
  onChange?: (code: string) => void;
}) {
  const ref = createRef<CodeEditorHandle>();
  const result = render(
    <CodeEditor
      ref={ref}
      defaultValue={opts.code ?? CODE}
      initialState={opts.initialState}
      onChange={opts.onChange ?? (() => undefined)}
      sourceId="test.squiggle"
      project={new SqProject()}
    />
  );
  const dom = await waitFor(() => {
    const el = result.container.querySelector<HTMLElement>(".cm-editor");
    if (!el) throw new Error("no editor yet");
    return el;
  });
  const view = EditorView.findFromDOM(dom);
  if (!view || !ref.current) throw new Error("no editor view");
  return { ...result, ref, dom, view, handle: ref.current };
}

// A user edit (recorded in the undo history).
function type(view: EditorView, from: number, insert: string) {
  act(() => {
    view.dispatch({ changes: { from, insert }, userEvent: "input.type" });
  });
}

const doc = (view: EditorView) => view.state.doc.toString();

describe("applyExternalChange", () => {
  test("keeps the selection and isn't undoable", async () => {
    const { view, handle } = await renderEditor({});
    type(view, 0, "// mine\n"); // the user's own edit, at the top
    act(() => {
      view.dispatch({ selection: { anchor: 10, head: 12 } }); // inside "a = 1"
    });

    // Another program edits the last line.
    const external = doc(view).replace("c = 3", "c = 30");
    act(() => handle.applyExternalChange(external));
    expect(doc(view)).toBe(external);
    expect(view.state.selection.main.from).toBe(10);
    expect(view.state.selection.main.to).toBe(12);

    // Undo removes the user's edit only; the external change stays.
    act(() => {
      expect(runEditorCommand(view.dom, "undo")).toBe(true);
    });
    expect(doc(view)).toBe("a = 1\nb = 2\nc = 30\n");
    act(() => {
      expect(runEditorCommand(view.dom, "undo")).toBe(false);
    });
    expect(doc(view)).toBe("a = 1\nb = 2\nc = 30\n");
  });

  test("maps a selection after the changed range", async () => {
    const { view, handle } = await renderEditor({});
    act(() => {
      view.dispatch({ selection: { anchor: CODE.indexOf("c = 3") } });
    });
    act(() => handle.applyExternalChange("a = 100\nb = 2\nc = 3\n"));
    expect(view.state.selection.main.head).toBe(
      "a = 100\nb = 2\nc = 3\n".indexOf("c = 3")
    );
  });

  test("does nothing when the code is the same", async () => {
    const changes: string[] = [];
    const { view, handle } = await renderEditor({
      onChange: (code) => changes.push(code),
    });
    act(() => handle.applyExternalChange(CODE));
    expect(doc(view)).toBe(CODE);
    expect(changes).toEqual([]);
  });
});

describe("getState / initialState", () => {
  test("round-trips the undo history and the selection", async () => {
    const first = await renderEditor({});
    type(first.view, CODE.length, "d = 4\n");
    act(() => {
      first.view.dispatch({ selection: { anchor: 2 } });
    });
    const snapshot = first.handle.getState();
    expect(snapshot).toBeDefined();
    const edited = doc(first.view);
    first.unmount();

    const second = await renderEditor({ code: edited, initialState: snapshot });
    expect(doc(second.view)).toBe(edited);
    expect(second.view.state.selection.main.head).toBe(2);
    act(() => {
      expect(runEditorCommand(second.dom, "undo")).toBe(true);
    });
    expect(doc(second.view)).toBe(CODE);
  });

  test("applies code changed meanwhile as an external change", async () => {
    const first = await renderEditor({});
    type(first.view, 0, "x = 0\n");
    const snapshot = first.handle.getState();
    first.unmount();

    // Another program changed the last line while the editor was gone.
    const changed = "x = 0\na = 1\nb = 2\nc = 33\n";
    const second = await renderEditor({
      code: changed,
      initialState: snapshot,
    });
    expect(doc(second.view)).toBe(changed);
    act(() => {
      runEditorCommand(second.dom, "undo");
    });
    expect(doc(second.view)).toBe("a = 1\nb = 2\nc = 33\n");
  });

  test("an unreadable snapshot gives a fresh editor", async () => {
    const { view } = await renderEditor({
      initialState: { state: { nonsense: true }, scrollTop: 0 },
    });
    expect(doc(view)).toBe(CODE);
  });
});

describe("runEditorCommand", () => {
  test("undo and redo", async () => {
    const { view, dom } = await renderEditor({});
    type(view, 0, "z = 9\n");
    act(() => {
      expect(runEditorCommand(dom, "undo")).toBe(true);
    });
    expect(doc(view)).toBe(CODE);
    act(() => {
      expect(runEditorCommand(dom, "redo")).toBe(true);
    });
    expect(doc(view)).toBe(`z = 9\n${CODE}`);
  });

  test("toggleComment comments and uncomments the line", async () => {
    const { view, dom } = await renderEditor({});
    act(() => {
      view.dispatch({ selection: { anchor: CODE.indexOf("b = 2") } });
    });
    act(() => {
      expect(runEditorCommand(dom, "toggleComment")).toBe(true);
    });
    expect(doc(view)).toBe("a = 1\n// b = 2\nc = 3\n");
    act(() => {
      runEditorCommand(dom, "toggleComment");
    });
    expect(doc(view)).toBe(CODE);
  });

  test("selectAll, find and replace", async () => {
    const { view, dom } = await renderEditor({});
    act(() => {
      expect(runEditorCommand(dom, "selectAll")).toBe(true);
    });
    expect(view.state.selection.main.from).toBe(0);
    expect(view.state.selection.main.to).toBe(CODE.length);

    act(() => {
      expect(runEditorCommand(dom, "find")).toBe(true);
    });
    expect(dom.querySelector(".cm-search")).not.toBeNull();
    act(() => {
      expect(runEditorCommand(dom, "replace")).toBe(true);
    });
    expect(document.activeElement).toBe(
      dom.querySelector(".cm-search input[name=replace]")
    );
  });

  test("works from any element inside the editor, not outside", async () => {
    const { view, dom } = await renderEditor({});
    type(view, 0, "q = 1\n");
    const line = dom.querySelector(".cm-line");
    expect(line).not.toBeNull();
    act(() => {
      expect(runEditorCommand(line as Element, "undo")).toBe(true);
    });
    expect(doc(view)).toBe(CODE);
    expect(runEditorCommand(document.body, "undo")).toBe(false);
  });
});

describe("cursorEventExtension", () => {
  test("fires sq-editor-cursor with line, column and selection size", async () => {
    const details: EditorCursorDetail[] = [];
    const listener = (e: Event) =>
      details.push((e as CustomEvent<EditorCursorDetail>).detail);
    document.addEventListener(SQ_EDITOR_CURSOR_EVENT, listener);
    try {
      const { view } = await renderEditor({});
      // The initial position.
      await waitFor(() => expect(details.length).toBeGreaterThan(0));
      expect(details.at(-1)).toEqual({
        line: 1,
        column: 1,
        selected: 0,
        fromLine: 1,
        toLine: 1,
      });

      // Line 2, column 3, with 2 characters selected.
      const from = CODE.indexOf("b = 2") + 2;
      act(() => {
        view.dispatch({ selection: { anchor: from - 2, head: from } });
      });
      await waitFor(() =>
        expect(details.at(-1)).toEqual({
          line: 2,
          column: 3,
          selected: 2,
          fromLine: 2,
          toLine: 2,
        })
      );

      // Lines 1 to 2: a selection ending at the start of line 3 doesn't
      // count line 3.
      const line3 = CODE.split("\n").slice(0, 2).join("\n").length + 1;
      act(() => {
        view.dispatch({ selection: { anchor: 0, head: line3 } });
      });
      await waitFor(() =>
        expect(details.at(-1)).toMatchObject({ fromLine: 1, toLine: 2 })
      );
    } finally {
      document.removeEventListener(SQ_EDITOR_CURSOR_EVENT, listener);
    }
  });
});
