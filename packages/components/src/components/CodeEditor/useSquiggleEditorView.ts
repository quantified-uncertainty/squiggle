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
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
} from "@codemirror/view";
import { useMemo } from "react";

import {
  useCodemirrorView,
  useConfigureCodemirrorView,
} from "./codemirrorHooks.js";
import { CodeEditorProps } from "./index.js";
import { lightThemeHighlightingStyle } from "./languageSupport/highlightingStyle.js";
import { useErrorsExtension } from "./useErrorsExtension.js";
import { useFormatSquiggleExtension } from "./useFormatSquiggleExtension.js";
import { useLineWrappingExtension } from "./useLineWrappingExtension.js";
import { useOnChangeExtension } from "./useOnChangeExtension.js";
import { useShowGutterExtension } from "./useShowGutterExtension.js";
import { useSquiggleLanguageExtension } from "./useSquiggleLanguageExtension.js";
import { useSubmitExtension } from "./useSubmitExtension.js";
import { useTooltipsExtension } from "./useTooltipsExtension.js";
import { useViewNodeExtension } from "./useViewNodeExtension.js";
import { useWidthHeightExtension } from "./useWidthHeightExtension.js";

export function useSquiggleEditorExtensions(
  view: EditorView | undefined,
  params: Omit<CodeEditorProps, "defaultValue">
) {
  /**
   * All this code will run on each CodeEditor re-render, but the resulting value will be used only on the initial render.
   * We still have to run all `use.*Extension` hooks every time, because they set up `useEffect` hooks.
   * After the initial render, the extensions are re-configured through `useEffect` on props changes.
   */

  const builtinExtensions = useMemo(
    () => [
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
    ],
    []
  );

  const squiggleLanguageExtension = useSquiggleLanguageExtension(
    view,
    params.project
  );
  const activeLineNumbers = params.sourceId
    ? params.project.getActiveLineNumbers(params.sourceId)
    : [];
  const showGutterExtension = useShowGutterExtension(
    view,
    params.showGutter ?? false,
    (line) => {
      if (params.sourceId) {
        const valuePath = params.project.findValuePathByLine(
          params.sourceId,
          line
        );
        if (valuePath && params.onViewValuePath) {
          params.onViewValuePath(valuePath);
        }
      }
    },
    activeLineNumbers
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

  const formatExtension = useFormatSquiggleExtension();
  const errorsExtension = useErrorsExtension(view, params.errors);

  const tooltipsExtension = useTooltipsExtension();

  const highPrioritySquiggleExtensions = [
    submitExtension, // works only if listed before `builtinExtensions`
  ];
  const squiggleExtensions = [
    showGutterExtension,
    lineWrappingExtension,
    onChangeExtension,
    widthHeightExtension,
    viewNodeExtension,
    formatExtension,
    errorsExtension,
    tooltipsExtension,
    squiggleLanguageExtension,
  ];

  return [
    highPrioritySquiggleExtensions,
    builtinExtensions,
    squiggleExtensions,
  ];
}

export function useSquiggleEditorView({
  defaultValue,
  ...params
}: CodeEditorProps) {
  /**
   * The flow here is a bit complicated:
   * - first, we have to create an undefined view state
   * - then we pass it to a hook that creates all extensions; extensions need to reference `view` to set up `useEffect` that would react to param changes
   * - then we configure the initial view based on those extensions
   * - after that, `useSquiggleEditorExtensions` will fire again; its result value won't be used but it will set up the proper `useEffect` hooks so that the extensions would be reconfigured on prop changes.
   *
   * This is necessary because we want to store each Codemirror extension + its `useEffect` as a single unit (`use.*Extension` hooks).
   * The complexity here allows us to make the rest of the configuration more manageable.
   */
  const [view, setView] = useCodemirrorView();

  const extensions = useSquiggleEditorExtensions(view, params);
  const ref = useConfigureCodemirrorView(view, setView, {
    extensions,
    doc: defaultValue,
  });

  return { view, ref };
}
