import { forwardRef } from "react";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SquiggleErrorAlert } from "../../index.js";
import {
  ViewerTab,
  viewerTabToValue,
  viewerTabToVisibleRootPath,
} from "../../lib/utility.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerWithoutProvider } from "../SquiggleViewer/index.js";
import {
  ExternalViewerActions,
  SquiggleViewerHandle,
  ViewerProvider,
} from "../SquiggleViewer/ViewerProvider.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";

type Props = {
  viewerTab: ViewerTab;
  outputResult: SqOutputResult;
  isSimulating: boolean;
  externalActions?: ExternalViewerActions;
  playgroundSettings: PartialPlaygroundSettings;
};

export const ViewerBody = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerBody(
    {
      outputResult,
      viewerTab,
      isSimulating,
      externalActions,
      playgroundSettings,
    },
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
            <div className="absolute inset-0 z-10 bg-white opacity-50" />
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
        ref={viewerRef}
        partialPlaygroundSettings={playgroundSettings}
        externalActions={externalActions}
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
