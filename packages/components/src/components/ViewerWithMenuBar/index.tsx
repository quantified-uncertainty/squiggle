import { forwardRef, useState } from "react";

import { isSimulating, Simulation } from "../../lib/hooks/useSimulator.js";
import { defaultViewerTab, ViewerTab } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RunSeedButton } from "./RunSeedButton.js";
import { SimulatingIndicator } from "./SimulatingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  simulation: Simulation;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  showMenu?: boolean;
  defaultTab?: ViewerTab;
  randomizeSeed: (() => void) | undefined;
  autorunMode?: boolean;
};

/* Wrapper for SquiggleViewer that shows the rendering stats and isSimulating state. */
export const ViewerWithMenuBar = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerWithMenuBar(
    {
      simulation: simulation,
      playgroundSettings,
      randomizeSeed,
      showMenu = true,
      editor,
      defaultTab,
      autorunMode,
    },
    viewerRef
  ) {
    const [viewerTab, setViewerTab] = useState<ViewerTab>(
      defaultTab ?? defaultViewerTab(simulation.output)
    );

    const _isSimulating = isSimulating(simulation);
    const { output } = simulation;

    return (
      <Layout
        menu={
          showMenu ? (
            <ViewerMenu
              viewerTab={viewerTab}
              setViewerTab={setViewerTab}
              outputResult={output}
            />
          ) : (
            <div />
          ) // Important not to be null, so that it stays on the right.
        }
        indicator={<SimulatingIndicator simulation={simulation} />}
        changeSeedAndRunButton={
          randomizeSeed ? (
            <RunSeedButton
              isSimulating={_isSimulating}
              seed={simulation.environment.seed || "default-seed"}
              randomizeSeed={randomizeSeed}
            />
          ) : null
        }
        viewer={
          <ViewerBody
            viewerTab={viewerTab}
            outputResult={output}
            isSimulating={isSimulating(simulation)}
            playgroundSettings={playgroundSettings}
            ref={viewerRef}
            editor={editor}
          />
        }
      />
    );
  }
);
