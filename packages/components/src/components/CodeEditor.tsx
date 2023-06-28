import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
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
  height?: number;
  showGutter?: boolean;
  errors?: SqError[];
  sourceId?: string;
  project: SqProject;
}

export type CodeEditorHandle = {
  format(): void;
  scrollTo(position: number): void;
};

const compTheme = new Compartment();
const compGutter = new Compartment();
const compUpdateListener = new Compartment();
const compSubmitListener = new Compartment();
const compFormatListener = new Compartment();
const compViewNodeListener = new Compartment();

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
    },
    ref
  ) {
    const editor = useRef<HTMLDivElement>(null);
    const editorView = useRef<EditorView | null>(null);

    const projectRef = useRef<SqProject | null>(null);
    const languageSupport = useMemo(
      // We don't pass `project` because its value can be updated (in theory...),
      // and I couldn't find quickly how to update EditorState extensions.
      () => squiggleLanguageSupport(projectRef),
      []
    );
    useEffect(() => {
      projectRef.current = project;
    }, [project]);

    const format = useCallback(async () => {
      if (!editorView.current) {
        return;
      }
      const view = editorView.current;
      const code = view.state.doc.toString();
      const { formatted, cursorOffset } = await prettier.formatWithCursor(
        code,
        {
          parser: "squiggle",
          plugins: [squigglePlugin],
          cursorOffset: editorView.current.state.selection.main.to,
        }
      );
      onChange(formatted);
      view.dispatch({
        changes: {
          from: 0,
          to: editorView.current.state.doc.length,
          insert: formatted,
        },
        selection: {
          anchor: cursorOffset,
        },
      });
    }, [onChange]);

    const scrollTo = (position: number) => {
      editorView.current?.dispatch({
        selection: {
          anchor: position,
        },
        scrollIntoView: true,
      });
      editorView.current?.focus();
    };

    useImperativeHandle(ref, () => ({ format, scrollTo }));

    // Note the `useState` instead of `useMemo`; we never want to recreate EditorState, it would cause bugs.
    // `defaultValue` changes are ignored;
    // `languageSupport` changes (which depends on `project` prop) are handled with `projectRef`.
    const [state] = useState(() =>
      EditorState.create({
        doc: defaultValue,
        extensions: [
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
          languageSupport,
        ],
      })
    );

    useEffect(() => {
      if (editor.current) {
        const view = new EditorView({ state, parent: editor.current });
        editorView.current = view;

        return () => {
          view.destroy();
        };
      }
    }, [state]);

    useEffect(() => {
      editorView.current?.dispatch({
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
    }, [showGutter]);

    useEffect(() => {
      editorView.current?.dispatch({
        effects: compUpdateListener.reconfigure(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          })
        ),
      });
    }, [onChange]);

    useEffect(() => {
      editorView.current?.dispatch({
        effects: compTheme.reconfigure(
          EditorView.theme({
            "&": {
              ...(width === undefined ? {} : { width: `${width}px` }),
              ...(height === undefined ? {} : { height: `${height}px` }),
            },
            ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
            ".cm-content": { padding: 0 },
            ":-moz-focusring.cm-content": { outline: "none" },
          })
        ),
      });
    }, [width, height]);

    useEffect(() => {
      editorView.current?.dispatch({
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
    }, [onSubmit]);

    useEffect(() => {
      editorView.current?.dispatch({
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
    }, [format]);

    useEffect(() => {
      editorView.current?.dispatch({
        effects: compViewNodeListener.reconfigure(
          keymap.of([
            {
              key: "Alt-Shift-v",
              run: () => {
                if (!onViewValuePath) {
                  return true;
                }
                const offset = editorView.current?.state.selection.main.to;
                if (offset === undefined) {
                  return true;
                }
                if (sourceId === undefined) {
                  return true;
                }
                const valuePathResult = project.findValuePathByOffset(
                  sourceId,
                  offset
                );
                if (valuePathResult.ok) {
                  onViewValuePath(valuePathResult.value);
                }
                return true;
              },
            },
          ])
        ),
      });
    }, [onViewValuePath, project, sourceId]);

    useEffect(() => {
      if (!editorView.current) {
        return;
      }
      const docLength = editorView.current.state.doc.length;

      editorView.current?.dispatch(
        setDiagnostics(
          editorView.current.state,
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
    }, [errors]);

    return (
      <div style={{ minWidth: width, minHeight: height }} ref={editor}></div>
    );
  }
);
