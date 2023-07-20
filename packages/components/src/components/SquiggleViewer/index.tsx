import { FC, forwardRef, memo } from "react";

import { SqError, SqValue, SqValuePath, result } from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";
import { useImperativeHandle } from "react";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { MessageAlert } from "../Alert.js";
import { CodeEditorHandle } from "../CodeEditor.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { ExpressionViewer } from "./ExpressionViewer.js";
import {
  ViewerProvider,
  useFocus,
  useUnfocus,
  useViewerContext,
} from "./ViewerProvider.js";
import { extractSubvalueByPath } from "./utils.js";

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
};

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  result: result<SqValue, SqError>;
  localSettingsEnabled?: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

const SquiggleViewerBody: FC<{ value: SqValue }> = ({ value }) => {
  const { focused } = useViewerContext();

  const valueToRender = focused ? extractSubvalueByPath(value, focused) : value;

  if (!valueToRender) {
    return <MessageAlert heading="Focused variable is not defined" />;
  }

  return <ExpressionViewer value={valueToRender} />;
};

const SquiggleViewerOuter = forwardRef<
  SquiggleViewerHandle,
  SquiggleViewerProps
>(function SquiggleViewerOuter({ result }, ref) {
  const { focused, dispatch } = useViewerContext();
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
        .itemsAsValuePaths()
        .slice(0, -1)
        .map((path, i) => (
          <div key={i} className="flex items-center">
            <ChevronRightIcon className="text-slate-300" size={24} />
            <div onClick={() => focus(path)} className={navLinkStyle}>
              {path.items[i]}
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

  return (
    <div>
      {focusedNavigation}
      {result.ok ? (
        <SquiggleViewerBody value={result.value} />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </div>
  );
});

const innerComponent = forwardRef<SquiggleViewerHandle, SquiggleViewerProps>(
  function SquiggleViewer(
    {
      result,
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
      >
        <SquiggleViewerOuter result={result} ref={ref} />
      </ViewerProvider>
    );
  }
);

// React.memo and React.forwardRef are hard to combine in TypeScript;
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087#issuecomment-656596623
export const SquiggleViewer = memo(innerComponent) as typeof innerComponent;
