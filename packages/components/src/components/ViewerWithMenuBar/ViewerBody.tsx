import { forwardRef } from "react";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SquiggleErrorAlert } from "../../index.js";
import { ViewerTab, viewerTabToValue } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewer } from "../SquiggleViewer/index.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";

type Props = {
  viewerTab: ViewerTab;
  outputResult: SqOutputResult;
  isSimulating: boolean;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  sourceId: string;
};

export const ViewerBody = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerBody(
    {
      outputResult,
      viewerTab,
      isSimulating,
      editor,
      playgroundSettings,
      sourceId,
    },
    viewerRef
  ) {
    if (!outputResult.ok) {
      return <SquiggleErrorAlert error={outputResult.value} />;
    }

    const sqOutput = outputResult.value;

    if (viewerTab === "AST") {
      return (
        <pre className="text-xs">
          {JSON.stringify(sqOutput.bindings.asValue().context?.ast, null, 2)}
        </pre>
      );
    }

    const usedValue = viewerTabToValue(viewerTab, outputResult);

    if (!usedValue) {
      return null;
    }

    return (
      <div className="relative">
        {isSimulating && (
          // `opacity-0 squiggle-semi-appear` would be better, but won't work reliably until we move Squiggle evaluation to Web Workers
          <div className="absolute z-10 inset-0 bg-white opacity-50" />
        )}
        <SquiggleViewer
          ref={viewerRef}
          sqOutput={sqOutput}
          sourceId={sourceId}
          value={usedValue}
          editor={editor}
          {...playgroundSettings}
        />
      </div>
    );
  }
);
