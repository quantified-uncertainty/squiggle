import { forwardRef } from "react";

import { SqModuleOutput, SqProject } from "@quri/squiggle-lang";

import { SquiggleErrorAlert } from "../../index.js";
import {
  mainHeadName,
  renderedHeadName,
} from "../../lib/hooks/useSimulator.js";
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
import { StateGraphViewer } from "../StateGraphViewer/index.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";
import { Overlay } from "./Overlay.js";

type Props = {
  viewerTab: ViewerTab;
  outputResult: SqModuleOutput["result"];
  project: SqProject;
  isSimulating: boolean;
  externalViewerActions?: ExternalViewerActions;
  playgroundSettings: PartialPlaygroundSettings;
};

export const ViewerBody = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerBody(
    {
      viewerTab,
      outputResult,
      project,
      isSimulating,
      externalViewerActions,
      playgroundSettings,
    },
    viewerRef
  ) {
    const body = () => {
      if (viewerTab === "Dependency Graph") {
        return (
          <StateGraphViewer
            project={project}
            headTooltips={{
              [mainHeadName]:
                "Main head points to the module that should be simulated. When simulation is running, the main head is the module that's not simulated yet; otherwise it's the same as the rendered head.",
              [renderedHeadName]:
                "Rendered head points to the module that's displayed in the viewer. After the simulation is done, the rendered head switches to the same module as the main head, and the old module and its output are garbage collected.",
            }}
          />
        );
      }

      if (!outputResult.ok) {
        return <SquiggleErrorAlert error={outputResult.value} />;
      }

      const sqOutput = outputResult.value;

      if (viewerTab === "AST") {
        return (
          <pre className="text-xs">
            {JSON.stringify(
              sqOutput.bindings.asValue().context?.runContext.module.ast(),
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
          {isSimulating && <Overlay />}
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
