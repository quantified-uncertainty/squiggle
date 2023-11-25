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
import { EditorState, Extension } from "@codemirror/state";
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
import { useCallback, useEffect } from "react";

import * as prettierSquigglePlugin from "@quri/prettier-plugin-squiggle/standalone";
import * as prettier from "prettier/standalone";

import {
  SqCompileError,
  SqError,
  SqProject,
  SqRuntimeError,
  SqValuePath,
} from "@quri/squiggle-lang";

import {
  useCodemirrorView,
  useConfigureCodemirrorView,
  useReactiveExtension,
} from "./codemirrorHooks.js";
import { CodeEditorProps } from "./index.js";
import { lightThemeHighlightingStyle } from "./languageSupport/highlightingStyle.js";
import { squiggleLanguageSupport } from "./languageSupport/squiggle.js";

function useSquiggleLanguageExtension(
  view: EditorView | undefined,
  project: SqProject
) {
  return useReactiveExtension(view, () => squiggleLanguageSupport(project), [
    project,
  ]);
}

function useShowGutterExtension(
  view: EditorView | undefined,
  showGutter: boolean
) {
  return useReactiveExtension(
    view,
    () =>
      showGutter
        ? [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
          ]
        : [],
    [showGutter]
  );
}

function useLineWrappingExtension(
  view: EditorView | undefined,
  lineWrapping: boolean
) {
  return useReactiveExtension(
    view,
    () => (lineWrapping ? [EditorView.lineWrapping] : []),
    [lineWrapping]
  );
}

function useSubmitExtension(
  view: EditorView | undefined,
  onSubmit: (() => void) | undefined
) {
  return useReactiveExtension(
    view,
    () =>
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onSubmit?.();
            return true;
          },
        },
      ]),
    [onSubmit]
  );
}

function useOnChangeExtension(
  view: EditorView | undefined,
  onChange: (value: string) => void
) {
  return useReactiveExtension(
    view,
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    [onChange]
  );
}

function useWidthHeightExtension(
  view: EditorView | undefined,
  {
    width,
    height,
  }: { width: number | undefined; height: string | number | undefined }
) {
  return useReactiveExtension(
    view,
    () =>
      EditorView.theme({
        "&": {
          ...(width === undefined ? {} : { width }),
          ...(height === undefined ? {} : { height }),
        },
        ".cm-selectionMatch": { backgroundColor: "#33ae661a" },
        ".cm-content": { padding: 0 },
        ":-moz-focusring.cm-content": { outline: "none" },
      }),
    [width, height]
  );
}

function useViewNodeExtension(
  view: EditorView | undefined,
  {
    project,
    onViewValuePath,
    sourceId,
  }: {
    project: SqProject;
    onViewValuePath?: (path: SqValuePath) => void;
    sourceId?: string;
  }
) {
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

  return useReactiveExtension(
    view,
    () =>
      keymap.of([
        {
          key: "Alt-Shift-v",
          run: () => {
            viewCurrentPosition();
            return true;
          },
        },
      ]),
    [viewCurrentPosition]
  );
}

function useErrorsExtension(
  view: EditorView | undefined,
  errors: SqError[] | undefined = []
) {
  useEffect(() => {
    if (!view) return;
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
  }, [view, errors]);

  // fake extension
  return [] as Extension;
}

export function useSquiggleEditorExtensions(
  view: EditorView | undefined,
  params: Omit<CodeEditorProps, "defaultValue">
) {
  const builtinExtensions = [
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
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
  ];

  const squiggleLanguageExtension = useSquiggleLanguageExtension(
    view,
    params.project
  );
  const showGutterExtension = useShowGutterExtension(
    view,
    params.showGutter ?? false
  );
  const lineWrappingExtension = useLineWrappingExtension(
    view,
    params.lineWrapping ?? true
  );
  const submitExtension = useSubmitExtension(view, params.onSubmit);
  const onChangeExtension = useOnChangeExtension(view, params.onChange);
  const widthHeightExtension = useWidthHeightExtension(view, {
    width: params.width,
    height: params.height,
  });
  const viewNodeExtension = useViewNodeExtension(view, {
    project: params.project,
    onViewValuePath: params.onViewValuePath,
    sourceId: params.sourceId,
  });

  const formatExtension = keymap.of([
    {
      key: "Alt-Shift-f",
      run: (view) => {
        formatSquiggle(view);
        return true;
      },
    },
  ]);

  const errorsExtension = useErrorsExtension(view, params.errors);

  const squiggleExtensions = [
    squiggleLanguageExtension,
    showGutterExtension,
    lineWrappingExtension,
    submitExtension,
    onChangeExtension,
    widthHeightExtension,
    viewNodeExtension,
    formatExtension,
    errorsExtension,
  ];

  const extensions = [builtinExtensions, squiggleExtensions];

  return extensions;
}

export function useSquiggleEditorView({
  defaultValue,
  ...params
}: CodeEditorProps) {
  /**
   * This is awkward:
   * - first, we have to create an empty view state
   * - then we pass it to a hook that creates all extensions; extensions need to reference `view` to set up `useEffect` that would react to param changes
   * - then we configure the initial view based on those extensions
   */
  const view = useCodemirrorView();
  const extensions = useSquiggleEditorExtensions(view[0], params);
  useConfigureCodemirrorView(view, { extensions, doc: defaultValue });

  return view[0];
}

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

export async function scrollToPosition(
  view: EditorView | undefined,
  position: number
) {
  if (!view) return;
  view.dispatch({
    selection: { anchor: position },
    scrollIntoView: true,
  });
  view.focus();
}
