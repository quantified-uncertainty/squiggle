import { forwardRef } from "react";

import { SqModuleOutput } from "@quri/squiggle-lang";

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
  outputResult: SqModuleOutput["result"];
  isSimulating: boolean;
  externalViewerActions?: ExternalViewerActions;
  playgroundSettings: PartialPlaygroundSettings;
};

export const ViewerBody = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerBody(
    {
      outputResult,
      viewerTab,
      isSimulating,
      externalViewerActions,
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
            {JSON.stringify(
              sqOutput.bindings.asValue().context?.runContext.ast,
              null,
              2
            )}
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
        externalViewerActions={externalViewerActions}
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
