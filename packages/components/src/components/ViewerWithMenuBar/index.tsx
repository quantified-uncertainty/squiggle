import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { SqValuePath } from "@quri/squiggle-lang";

import { isSimulating, Simulation } from "../../lib/hooks/useSimulator.js";
import {
  defaultViewerTab,
  ViewerTab,
  viewerTabsToShow,
} from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RandomizeSeedButton } from "./RandomizeSeedButton.js";
import { SimulatingIndicator } from "./SimulatingIndicator.js";
import { useViewerTabShortcuts } from "./useViewerTabShortcuts.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  simulation: Simulation;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  showMenu?: boolean;
  defaultTab?: ViewerTab;
  useGlobalShortcuts?: boolean;
  randomizeSeed: (() => void) | undefined;
  xPadding?: number;
};

export type ViewerWithMenuBarHandle = {
  focusByPath: (path: SqValuePath) => void;
};
/* Wrapper for SquiggleViewer that shows the rendering stats and isSimulating state. */
export const ViewerWithMenuBar = forwardRef<ViewerWithMenuBarHandle, Props>(
  function ViewerWithMenuBar(
    {
      simulation: simulation,
      playgroundSettings,
      randomizeSeed,
      showMenu = true,
      editor,
      defaultTab,
      useGlobalShortcuts: enableGlobalShortcuts = false,
      xPadding = 2,
    },
    viewerWithMenuBarRef
  ) {
    const [viewerTab, setViewerTab] = useState<ViewerTab>(
      defaultTab ?? defaultViewerTab(simulation.output)
    );

    const viewerRef = useRef<SquiggleViewerHandle>(null);
    const _isSimulating = isSimulating(simulation);
    const { output } = simulation;
    const shownTabs = viewerTabsToShow(simulation.output);

    useViewerTabShortcuts({
      enableGlobalShortcuts,
      viewerTab,
      setViewerTab,
      shownTabs,
    });

    useImperativeHandle(viewerWithMenuBarRef, () => ({
      focusByPath: (path) => {
        const viewer = viewerRef.current;
        if (viewer) {
          if (path.root === "bindings") {
            setViewerTab("Variables");
          } else if (path.root === "result") {
            setViewerTab("Result");
          }

          setTimeout(() => {
            viewer.focusByPath(path);
          }, 0);
        }
      },
    }));

    return (
      <Layout
        menu={
          showMenu ? (
            <ViewerMenu
              viewerTab={viewerTab}
              setViewerTab={setViewerTab}
              outputResult={output}
              shownTabs={shownTabs}
            />
          ) : (
            // Important not to be null, so that it stays on the right.
            <div />
          )
        }
        indicator={<SimulatingIndicator simulation={simulation} />}
        changeSeedAndRunButton={
          randomizeSeed ? (
            <RandomizeSeedButton
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
        xPadding={xPadding}
      />
    );
  }
);
