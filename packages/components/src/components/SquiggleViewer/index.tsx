import { forwardRef, memo, useImperativeHandle } from "react";

import {
  SqDictValue,
  SqError,
  SqValue,
  SqValuePath,
  result,
} from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";

import { MessageAlert } from "../Alert.js";
import { CodeEditorHandle } from "../CodeEditor.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { ValueViewer } from "./ValueViewer.js";
import {
  ViewerProvider,
  useFocus,
  useUnfocus,
  useViewerContext,
} from "./ViewerProvider.js";
import { extractSubvalueByPath, pathItemFormat } from "./utils.js";

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
};

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  resultVariables: result<SqDictValue, SqError>;
  resultItem: result<SqValue, SqError> | undefined;
  localSettingsEnabled?: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

const SquiggleViewerOuter = forwardRef<
  SquiggleViewerHandle,
  SquiggleViewerProps
>(function SquiggleViewerOuter({ resultVariables, resultItem }, ref) {
  const { focused, dispatch, getCalculator } = useViewerContext();
  const unfocus = useUnfocus();
  const focus = useFocus();

  const navLinkStyle =
    "text-sm text-slate-500 hover:text-slate-900 hover:underline font-mono cursor-pointer";

  const focusedNavigation = focused && (
    <div className="flex items-center mb-3 pl-1">
      <span onClick={unfocus} className={navLinkStyle}>
        {focused.root === "bindings" ? "Variables" : focused.root}
      </span>

      {focused
        .itemsAsValuePaths({ includeRoot: false })
        .slice(0, -1)
        .map((path, i) => (
          <div key={i} className="flex items-center">
            <ChevronRightIcon className="text-slate-300" size={24} />
            <div onClick={() => focus(path)} className={navLinkStyle}>
              {pathItemFormat(path.items[i])}
            </div>
          </div>
        ))}
      <ChevronRightIcon className="text-slate-300" size={24} />
    </div>
  );

  useImperativeHandle(ref, () => ({
    viewValuePath(path: SqValuePath) {
      dispatch({
        type: "SCROLL_TO_PATH",
        payload: { path },
      });
    },
  }));

  const resultVariableLength = resultVariables.ok
    ? resultVariables.value.value.entries().length
    : 0;

  let focusedItem: SqValue | undefined;
  if (focused && resultVariables.ok && focused.root === "bindings") {
    focusedItem = extractSubvalueByPath(
      resultVariables.value,
      focused,
      getCalculator
    );
  } else if (focused && resultItem?.ok && focused.root === "result") {
    focusedItem = extractSubvalueByPath(
      resultItem.value,
      focused,
      getCalculator
    );
  }

  const body = () => {
    if (focused) {
      if (focusedItem) {
        return <ValueViewer value={focusedItem} />;
      } else {
        return <MessageAlert heading="Focused variable is not defined" />;
      }
    } else if (!resultVariables.ok) {
      return <SquiggleErrorAlert error={resultVariables.value} />;
    } else {
      return (
        <div className="space-y-2">
          {resultVariables.ok && resultVariableLength > 0 && (
            <ValueViewer value={resultVariables.value} />
          )}
          {resultItem && resultItem.ok && (
            <ValueViewer value={resultItem.value} />
          )}
        </div>
      );
    }
  };

  return (
    <div>
      {focusedNavigation}
      {body()}
    </div>
  );
});

const innerComponent = forwardRef<SquiggleViewerHandle, SquiggleViewerProps>(
  function SquiggleViewer(
    {
      resultVariables,
      resultItem,
      localSettingsEnabled = false,
      editor,
      ...partialPlaygroundSettings
    },
    ref
  ) {
    return (
      <ViewerProvider
        partialPlaygroundSettings={partialPlaygroundSettings}
        localSettingsEnabled={localSettingsEnabled}
        editor={editor}
        beginWithVariablesCollapsed={resultItem !== undefined && resultItem.ok}
      >
        <SquiggleViewerOuter
          resultVariables={resultVariables}
          resultItem={resultItem}
          ref={ref}
        />
      </ViewerProvider>
    );
  }
);

// React.memo and React.forwardRef are hard to combine in TypeScript;
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087#issuecomment-656596623
export const SquiggleViewer = memo(innerComponent) as typeof innerComponent;
