import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import * as prettier from "prettier/standalone";

import { defaultKeymap } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { setDiagnostics } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
// From basic setup
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  lineNumbers,
} from "@codemirror/view";

import * as squigglePlugin from "@quri/prettier-plugin-squiggle/standalone";
import {
  SqCompileError,
  SqError,
  SqProject,
  SqRuntimeError,
  SqValuePath,
} from "@quri/squiggle-lang";

import { lightThemeHighlightingStyle } from "../languageSupport/highlightingStyle.js";
import { squiggleLanguageSupport } from "../languageSupport/squiggle.js";

interface CodeEditorProps {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onViewValuePath?: (path: SqValuePath) => void;
  width?: number;
  height?: number | string;
  showGutter?: boolean;
  lineWrapping?: boolean;
  errors?: SqError[];
  sourceId?: string;
  project: SqProject;
}

export type CodeEditorHandle = {
  format(): void;
  scrollTo(position: number): void;
  viewCurrentPosition(): void;
};

const compTheme = new Compartment();
const compGutter = new Compartment();
const compUpdateListener = new Compartment();
const compSubmitListener = new Compartment();
const compFormatListener = new Compartment();
const compViewNodeListener = new Compartment();
const compLineWrapping = new Compartment();
const compLanguageSupport = new Compartment();

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    {
      defaultValue,
      onChange,
      onSubmit,
      onViewValuePath,
      width,
      height,
      showGutter = false,
      errors = [],
      sourceId,
      project,
      lineWrapping = true,
    },
    ref
  ) {
    const [view, setView] = useState<EditorView>();

    useEffect(() => {
      if (typeof window === "undefined") {
        return; // no SSR
      }
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
        compFormatListener.of([]),
        compViewNodeListener.of([]),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        compGutter.of([]),
        compUpdateListener.of([]),
        compTheme.of([]),
        compLanguageSupport.of([]),
        // might be unnecessary, but might help with redraw if `useEffect` configuring the compartment fires too late
        compLineWrapping.of(lineWrapping ? [EditorView.lineWrapping] : []),
      ];

      const state = EditorState.create({
        doc: defaultValue,
        extensions,
      });
      setView(new EditorView({ state }));
      return () => {
        view?.destroy();
      };
      // we initialize the view only once; no need for deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const format = useCallback(async () => {
      if (!view) return;
      const code = view.state.doc.toString();
      const { formatted, cursorOffset } = await prettier.formatWithCursor(
        code,
        {
          parser: "squiggle",
          plugins: [squigglePlugin],
          cursorOffset: view.state.selection.main.to,
        }
      );
      onChange(formatted);
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
    }, [onChange, view]);

    const scrollTo = (position: number) => {
      view?.dispatch({
        selection: {
          anchor: position,
        },
        scrollIntoView: true,
      });
      view?.focus();
    };

    const viewCurrentPosition = useCallback(() => {
      if (!onViewValuePath || !view || !sourceId) {
        return;
      }
      const offset = view.state.selection.main.to;
      if (offset === undefined) {
        return;
      }
      const valuePathResult = project.findValuePathByOffset(sourceId, offset);
      if (valuePathResult.ok) {
        onViewValuePath(valuePathResult.value);
      }
    }, [onViewValuePath, project, sourceId, view]);

    useImperativeHandle(ref, () => ({ format, scrollTo, viewCurrentPosition }));

    useEffect(() => {
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
    }, [showGutter, view]);

    useEffect(() => {
      view?.dispatch({
        effects: compLanguageSupport.reconfigure(
          squiggleLanguageSupport(project)
        ),
      });
    }, [project, view]);

    useEffect(() => {
      view?.dispatch({
        effects: compUpdateListener.reconfigure(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          })
        ),
      });
    }, [onChange, view]);

    useEffect(() => {
      view?.dispatch({
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
    }, [width, height, view]);

    useEffect(() => {
      view?.dispatch({
        effects: compLineWrapping.reconfigure(
          lineWrapping ? [EditorView.lineWrapping] : []
        ),
      });
    }, [lineWrapping, view]);

    useEffect(() => {
      view?.dispatch({
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
    }, [onSubmit, view]);

    useEffect(() => {
      view?.dispatch({
        effects: compFormatListener.reconfigure(
          keymap.of([
            {
              key: "Alt-Shift-f",
              run: () => {
                format();
                return true;
              },
            },
          ])
        ),
      });
    }, [format, view]);

    useEffect(() => {
      if (!view) return;
      view.dispatch({
        effects: compViewNodeListener.reconfigure(
          keymap.of([
            {
              key: "Alt-Shift-v",
              run: () => {
                viewCurrentPosition();
                return true;
              },
            },
          ])
        ),
      });
    }, [view, viewCurrentPosition]);

    useEffect(() => {
      if (!view) return;
      const docLength = view.state.doc.length;

      view.dispatch(
        setDiagnostics(
          view.state,
          errors
            .map((err) => {
              if (
                !(
                  err instanceof SqCompileError || err instanceof SqRuntimeError
                )
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
    }, [errors, view]);

    const setViewDom = useCallback(
      (element: HTMLDivElement | null) => {
        if (!view) return;
        // TODO: the editor breaks on hot reloading in storybook, investigate
        element?.replaceChildren(view.dom);
      },
      [view]
    );

    return <div style={{ fontSize: "13px" }} ref={setViewDom}></div>;
  }
);
