import { FC, forwardRef, memo } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { FocusIcon } from "@quri/ui";
import { useSquiggle } from "../../lib/hooks/index.js";
import { MessageAlert } from "../Alert.js";
import { CodeEditorHandle } from "../CodeEditor.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { ExpressionViewer } from "./ExpressionViewer.js";
import {
  ViewerProvider,
  useUnfocus,
  useViewerContext,
} from "./ViewerProvider.js";
import { extractSubvalueByLocation, locationAsString } from "./utils.js";
import { SqValueLocation } from "@quri/squiggle-lang";
import { useImperativeHandle } from "react";

type Result = NonNullable<ReturnType<typeof useSquiggle>[0]>["result"];

export type SquiggleViewerHandle = {
  viewValueLocation(location: SqValueLocation): void;
};

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  result: Result;
  localSettingsEnabled?: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

type BodyProps = Pick<SquiggleViewerProps, "result">;

const SquiggleViewerBody: FC<{ value: SqValue }> = ({ value }) => {
  const { focused } = useViewerContext();

  const valueToRender = focused
    ? extractSubvalueByLocation(value, focused)
    : value;

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

  useImperativeHandle(ref, () => ({
    viewValueLocation(location: SqValueLocation) {
      dispatch({
        type: "SCROLL_TO_LOCATION",
        payload: { location },
      });
    },
  }));

  return (
    <div>
      {focused && (
        <div className="flex items-center gap-2 mb-1">
          <FocusIcon />
          <div className="text-stone-800 font-mono text-sm">
            {locationAsString(focused)}
          </div>
          <button
            className="text-xs px-1 py-0.5 rounded bg-stone-200 hover:bg-stone-400"
            onClick={unfocus}
          >
            Show all
          </button>
        </div>
      )}
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
