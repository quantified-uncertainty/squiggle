import { FC } from "react";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SquiggleErrorAlert } from "../../index.js";
import { ViewerTab, viewerTabToValue } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewer } from "../SquiggleViewer/index.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";

type Props = {
  viewerTab: ViewerTab;
  output: SqOutputResult;
  isRunning: boolean;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  viewerRef?: React.ForwardedRef<SquiggleViewerHandle>;
};

export const ViewerBody: FC<Props> = ({
  output,
  viewerTab,
  playgroundSettings,
  viewerRef,
  editor,
  isRunning,
}) => {
  if (!output.ok) {
    return <SquiggleErrorAlert error={output.value} />;
  }

  const sqOutput = output.value;

  if (viewerTab === "AST") {
    return (
      <pre className="text-xs">
        {JSON.stringify(sqOutput.bindings.asValue().context?.ast, null, 2)}
      </pre>
    );
  }

  const usedValue = viewerTabToValue(viewerTab, output);

  if (!usedValue) {
    return null;
  }

  return (
    <div className="relative">
      {isRunning && (
        // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
        <div className="absolute z-10 inset-0 bg-white opacity-50" />
      )}
      <SquiggleViewer
        ref={viewerRef}
        value={usedValue}
        editor={editor}
        {...playgroundSettings}
      />
    </div>
  );
};
