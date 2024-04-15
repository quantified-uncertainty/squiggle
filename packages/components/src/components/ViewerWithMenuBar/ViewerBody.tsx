import { forwardRef } from "react";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SquiggleErrorAlert } from "../../index.js";
import {
  ViewerTab,
  viewerTabToValue,
  viewerTabToVisibleRootPath,
} from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerWithoutProvider } from "../SquiggleViewer/index.js";
import {
  SquiggleViewerHandle,
  ViewerProvider,
} from "../SquiggleViewer/ViewerProvider.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";

type Props = {
  viewerTab: ViewerTab;
  outputResult: SqOutputResult;
  isSimulating: boolean;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
};

export const ViewerBody = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerBody(
    { outputResult, viewerTab, isSimulating, editor, playgroundSettings },
    viewerRef
  ) {
    const body = () => {
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
            <div className="absolute z-10 inset-0 bg-white opacity-50" />
          )}
          {
            <SquiggleViewerWithoutProvider
              value={viewerTabToValue(viewerTab, outputResult)!}
            />
          }
        </div>
      );
    };

    return (
      <ViewerProvider
        partialPlaygroundSettings={playgroundSettings}
        editor={editor}
        ref={viewerRef}
        visibleRootPath={viewerTabToVisibleRootPath(viewerTab)}
        rootValue={
          outputResult.ok
            ? viewerTabToValue(viewerTab, outputResult)
            : undefined
        }
      >
        <ErrorBoundary>{body()}</ErrorBoundary>
      </ViewerProvider>
    );
  }
);
