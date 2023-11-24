import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { setDiagnostics } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import * as prettier from "prettier/standalone";

import * as squigglePlugin from "@quri/prettier-plugin-squiggle/standalone";
import {
  SqCompileError,
  SqError,
  SqProject,
  SqRuntimeError,
} from "@quri/squiggle-lang";

import { lightThemeHighlightingStyle } from "./languageSupport/highlightingStyle.js";
import { squiggleLanguageSupport } from "./languageSupport/squiggle.js";

export const compTheme = new Compartment();
const compGutter = new Compartment();
export const compUpdateListener = new Compartment();
export const compSubmitListener = new Compartment();
export const compViewNodeListener = new Compartment();
export const compLineWrapping = new Compartment();
const compLanguageSupport = new Compartment();

export function getCodeEditorExtensions(params: { lineWrapping: boolean }) {
  const extensions = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(lightThemeHighlightingStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    highlightSelectionMatches({
      wholeWords: true,
      highlightWordAroundCursor: false, // Works weird on fractions! 5.3e10K
    }),
    compSubmitListener.of([]),
    compViewNodeListener.of([]),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
      {
        key: "Alt-Shift-f",
        run: (view) => {
          formatSquiggle(view);
          return true;
        },
      },
    ]),
    compGutter.of([]),
    compUpdateListener.of([]),
    compTheme.of([]),
    compLanguageSupport.of([]),
    // might be unnecessary, but might help with redraw if `useEffect` configuring the compartment fires too late
    compLineWrapping.of(params.lineWrapping ? [EditorView.lineWrapping] : []),
  ];

  return extensions;
}

export function setShowGutter(view: EditorView, showGutter: boolean) {
  view?.dispatch({
    effects: compGutter.reconfigure(
      showGutter
        ? [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
          ]
        : []
    ),
  });
}

export function setProject(view: EditorView, project: SqProject) {
  view.dispatch({
    effects: compLanguageSupport.reconfigure(squiggleLanguageSupport(project)),
  });
}

export function setOnChange(
  view: EditorView,
  onChange: (value: string) => void
) {
  view?.dispatch({
    effects: compUpdateListener.reconfigure(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      })
    ),
  });
}

export function setWidthHeight(
  view: EditorView,
  {
    width,
    height,
  }: { width: number | undefined; height: string | number | undefined }
) {
  view.dispatch({
    effects: compTheme.reconfigure(
      EditorView.theme({
        "&": {
          ...(width === undefined ? {} : { width }),
          ...(height === undefined ? {} : { height }),
        },
        ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
        ".cm-content": { padding: 0 },
        ":-moz-focusring.cm-content": { outline: "none" },
      })
    ),
  });
}

export function setLineWrapping(view: EditorView, lineWrapping: boolean) {
  view.dispatch({
    effects: compLineWrapping.reconfigure(
      lineWrapping ? [EditorView.lineWrapping] : []
    ),
  });
}

export function setOnSubmit(
  view: EditorView,
  onSubmit: (() => void) | undefined
) {
  view.dispatch({
    effects: compSubmitListener.reconfigure(
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onSubmit?.();
            return true;
          },
        },
      ])
    ),
  });
}

export async function formatSquiggle(view: EditorView) {
  const code = view.state.doc.toString();
  const { formatted, cursorOffset } = await prettier.formatWithCursor(code, {
    parser: "squiggle",
    plugins: [squigglePlugin],
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

export function scrollTo(view: EditorView, position: number) {
  view.dispatch({
    selection: {
      anchor: position,
    },
    scrollIntoView: true,
  });
  view.focus();
}

export function setErrors(view: EditorView, errors: SqError[]) {
  const docLength = view.state.doc.length;

  view.dispatch(
    setDiagnostics(
      view.state,
      errors
        .map((err) => {
          if (
            !(err instanceof SqCompileError || err instanceof SqRuntimeError)
          ) {
            return undefined;
          }
          const location = err.location();
          if (!location) {
            return undefined;
          }
          return {
            location,
            err,
          };
        })
        .filter((err): err is NonNullable<typeof err> => {
          return Boolean(
            err && err.location && err.location.end.offset < docLength
          );
        })
        .map((err) => ({
          from: err.location.start.offset,
          to: err.location.end.offset,
          severity: "error",
          message: err.err.toString(),
        }))
    )
  );
}
