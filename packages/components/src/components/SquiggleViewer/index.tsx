import { FC, memo } from "react";

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

type Result = NonNullable<ReturnType<typeof useSquiggle>[0]>["result"];

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

const SquiggleViewerOuter: FC<BodyProps> = ({ result }) => {
  const { focused } = useViewerContext();
  const unfocus = useUnfocus();

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
};

export const SquiggleViewer = memo<SquiggleViewerProps>(
  function SquiggleViewer({
    result,
    localSettingsEnabled = false,
    editor,
    ...partialPlaygroundSettings
  }) {
    return (
      <ViewerProvider
        partialPlaygroundSettings={partialPlaygroundSettings}
        localSettingsEnabled={localSettingsEnabled}
        editor={editor}
      >
        <SquiggleViewerOuter result={result} />
      </ViewerProvider>
    );
  }
);
