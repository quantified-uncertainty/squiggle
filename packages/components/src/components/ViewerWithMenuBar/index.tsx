import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { SqValuePath } from "@quri/squiggle-lang";

import { isSimulating, Simulation } from "../../lib/hooks/useSimulator.js";
import {
  defaultViewerTab,
  ViewerTab,
  viewerTabsToShow,
} from "../../lib/utility.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import {
  ExternalViewerActions,
  SquiggleViewerHandle,
} from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RandomizeSeedButton } from "./RandomizeSeedButton.js";
import { SimulatingIndicator } from "./SimulatingIndicator.js";
import { useViewerTabShortcuts } from "./useViewerTabShortcuts.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  simulation: Simulation;
  externalViewerActions?: ExternalViewerActions;
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
      simulation,
      playgroundSettings,
      randomizeSeed,
      showMenu = true,
      externalViewerActions,
      defaultTab,
      useGlobalShortcuts: enableGlobalShortcuts = false,
      xPadding = 2,
    },
    viewerWithMenuBarRef
  ) {
    const {
      output: { result: outputResult },
    } = simulation;
    const [viewerTab, setViewerTab] = useState<ViewerTab>(
      defaultTab ?? defaultViewerTab(outputResult)
    );

    const viewerRef = useRef<SquiggleViewerHandle>(null);
    const _isSimulating = isSimulating(simulation);
    const shownTabs = viewerTabsToShow(outputResult);

    useViewerTabShortcuts({
      enableGlobalShortcuts,
      viewerTab,
      setViewerTab,
      shownTabs,
    });

    const focusByPath = useCallback((path: SqValuePath) => {
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
    }, []);

    useImperativeHandle(viewerWithMenuBarRef, () => ({
      focusByPath,
    }));

    return (
      <Layout
        menu={
          showMenu ? (
            <ViewerMenu
              viewerTab={viewerTab}
              setViewerTab={setViewerTab}
              outputResult={outputResult}
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
              seed={simulation.output.environment.seed || "default-seed"}
              randomizeSeed={randomizeSeed}
            />
          ) : null
        }
        viewer={
          <ViewerBody
            externalViewerActions={externalViewerActions}
            viewerTab={viewerTab}
            outputResult={outputResult}
            isSimulating={isSimulating(simulation)}
            playgroundSettings={playgroundSettings}
            ref={viewerRef}
          />
        }
        xPadding={xPadding}
      />
    );
  }
);
