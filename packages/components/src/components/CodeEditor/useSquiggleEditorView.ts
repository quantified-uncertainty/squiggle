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
import { useState } from "react";

import {
  useCodemirrorView,
  useConfigureCodemirrorView,
} from "./codemirrorHooks.js";
import { errorsExtension } from "./errorsExtension.js";
import { showGutterFacet, useReactPropsField } from "./fields.js";
import { formatSquiggleExtension } from "./formatSquiggleExtension.js";
import { gutterExtension } from "./gutter/gutterExtension.js";
import { CodeEditorProps } from "./index.js";
import { lightThemeHighlightingStyle } from "./languageSupport/highlightingStyle.js";
import { squiggleLanguageExtension } from "./languageSupport/index.js";
import { lineWrappingExtension } from "./lineWrappingExtension.js";
import { onChangeExtension } from "./onChangeExtension.js";
import { onSubmitExtension } from "./onSubmitExtension.js";
import { profilerExtension } from "./profilerExtension.js";
import { themeExtension } from "./themeExtension.js";
import { tooltipsExtension } from "./tooltips/index.js";
import { viewNodeExtension } from "./viewNodeExtension.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function debugExtension() {
  // Print state or specific fields on changes.
  return EditorView.updateListener.of(({ state }) => {
    // eslint-disable-next-line no-console
    console.log(state.facet(showGutterFacet));
  });
}

export function useSquiggleEditorExtensions(
  view: EditorView | undefined,
  params: Omit<CodeEditorProps, "defaultValue">
) {
  /**
   * All this code will run on each CodeEditor re-render, but the resulting value will be used only on the initial render.
   * We still have to run all `use.*Extension` hooks every time, because they set up `useEffect` hooks.
   * After the initial render, the extensions are re-configured through `useEffect` on props changes.
   */
  const reactPropsField = useReactPropsField(
    {
      simulation: params.simulation ?? null,
      onFocusByPath: params.onFocusByPath ?? null,
      showGutter: params.showGutter ?? false,
      lineWrapping: params.lineWrapping ?? true,
      project: params.project,
      height: params.height ?? null,
      onChange: params.onChange,
      onSubmit: params.onSubmit ?? null,
      renderImportTooltip: params.renderImportTooltip ?? null,
    },
    view
  );

  // Extensions are initialized only once; all reconfigurations on prop changes
  // happen because `reactPropsField` extension updates in `useReactPropsField`
  // hook and causes facet updates.
  const [extensions] = useState(() => {
    const builtinExtensions = [
      // uncomment for local debugging:
      // debugExtension(),
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

    const highPrioritySquiggleExtensions = [
      onSubmitExtension(), // works only if listed before `builtinExtensions`
    ];

    const staticSquiggleExtensions = [
      onChangeExtension(),
      viewNodeExtension(),
      gutterExtension(params.showGutter ?? false),
      lineWrappingExtension(params.lineWrapping ?? true),
      formatSquiggleExtension(),
      errorsExtension(),
      profilerExtension(),
      squiggleLanguageExtension(params.renderImportTooltip ?? null),
      themeExtension({
        height: params.height,
      }),
      tooltipsExtension(),
    ];

    return [
      reactPropsField,
      highPrioritySquiggleExtensions,
      builtinExtensions,
      staticSquiggleExtensions,
    ];
  });

  return extensions;
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
