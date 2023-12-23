import { FC, forwardRef, Fragment, memo } from "react";

import {
  result,
  SqDictValue,
  SqError,
  SqValue,
  SqValuePath,
} from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";

import { useStabilizeObjectIdentity } from "../../lib/hooks/useStabilizeObject.js";
import { MessageAlert } from "../Alert.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import {
  nonHiddenDictEntries,
  pathIsEqual,
  pathItemFormat,
  useGetSubvalueByPath,
} from "./utils.js";
import { ValueViewer } from "./ValueViewer.js";
import {
  useFocus,
  useUnfocus,
  useViewerContext,
  ViewerProvider,
} from "./ViewerProvider.js";

const FocusedNavigation: FC<{
  focusedPath: SqValuePath;
  rootPath: SqValuePath | undefined;
}> = ({ focusedPath, rootPath }) => {
  const unfocus = useUnfocus();
  const focus = useFocus();

  const isFocusedOnRootPath = rootPath && pathIsEqual(focusedPath, rootPath);

  if (isFocusedOnRootPath) {
    return null;
  }

  const navLinkStyle =
    "text-sm text-stone-500 hover:text-stone-900 hover:underline font-mono cursor-pointer";

  // If we're focused on the root path override, we need to adjust the focused path accordingly when presenting the navigation, so that it begins with the root path intead. This is a bit confusing.
  const rootPathFocusedAdjustment = rootPath ? rootPath.items.length - 1 : 0;

  return (
    <div className="flex items-center mb-3 pl-3">
      {!rootPath && (
        <>
          <span onClick={unfocus} className={navLinkStyle}>
            {focusedPath.root === "bindings" ? "Variables" : focusedPath.root}
          </span>

          <ChevronRightIcon className="text-slate-300" size={24} />
        </>
      )}

      {focusedPath
        .itemsAsValuePaths({ includeRoot: false })
        .slice(rootPathFocusedAdjustment, -1)
        .map((path, i) => (
          <Fragment key={i}>
            <div onClick={() => focus(path)} className={navLinkStyle}>
              {pathItemFormat(path.items[i + rootPathFocusedAdjustment])}
            </div>
            <ChevronRightIcon className="text-slate-300" size={24} />
          </Fragment>
        ))}
    </div>
  );
};

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
};

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  resultVariables: result<SqDictValue, SqError>;
  resultItem: result<SqValue, SqError> | undefined;
  editor?: CodeEditorHandle;
  rootPathOverride?: SqValuePath;
} & PartialPlaygroundSettings;

const SquiggleViewerOuter: FC<SquiggleViewerProps> = ({
  resultVariables,
  resultItem,
  rootPathOverride,
}) => {
  const { focused = rootPathOverride } = useViewerContext();
  const resultVariableLength = resultVariables.ok
    ? nonHiddenDictEntries(resultVariables.value.value).length
    : 0;

  const getSubvalueByPath = useGetSubvalueByPath();

  let focusedItem: SqValue | undefined;
  if (focused && resultVariables.ok && focused.root === "bindings") {
    focusedItem = getSubvalueByPath(resultVariables.value, focused);
  } else if (focused && resultItem?.ok && focused.root === "result") {
    focusedItem = getSubvalueByPath(resultItem.value, focused);
  }

  const body = () => {
    if (!resultVariables.ok) {
      return (
        <div className="px-1">
          <SquiggleErrorAlert error={resultVariables.value} />
        </div>
      );
    } else if (focused) {
      if (focusedItem) {
        return <ValueViewer value={focusedItem} />;
      } else {
        return <MessageAlert heading="Focused variable is not defined" />;
      }
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
      {focused && (
        <FocusedNavigation focusedPath={focused} rootPath={rootPathOverride} />
      )}
      {body()}
    </div>
  );
};

const innerComponent = forwardRef<SquiggleViewerHandle, SquiggleViewerProps>(
  function SquiggleViewer(
    {
      resultVariables,
      resultItem,
      editor,
      rootPathOverride,
      ...partialPlaygroundSettings
    },
    ref
  ) {
    /**
     * Because we obtain `partialPlaygroundSettings` with spread syntax, its identity changes on each render, which could
     * cause extra unnecessary re-renders of widgets, in some cases.
     * Related discussion: https://github.com/quantified-uncertainty/squiggle/pull/2525#discussion_r1393398447
     */
    const stablePartialPlaygroundSettings = useStabilizeObjectIdentity(
      partialPlaygroundSettings
    );

    const hasResultVariables =
      resultVariables.ok &&
      nonHiddenDictEntries(resultVariables.value.value).length > 0;

    return (
      <ViewerProvider
        partialPlaygroundSettings={stablePartialPlaygroundSettings}
        editor={editor}
        beginWithVariablesCollapsed={resultItem?.ok && hasResultVariables}
        ref={ref}
      >
        <SquiggleViewerOuter
          resultVariables={resultVariables}
          resultItem={resultItem}
          rootPathOverride={rootPathOverride}
        />
      </ViewerProvider>
    );
  }
);

// React.memo and React.forwardRef are hard to combine in TypeScript;
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087#issuecomment-656596623
export const SquiggleViewer = memo(innerComponent) as typeof innerComponent;
