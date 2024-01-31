import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { isSimulating, Simulation } from "../../lib/hooks/useSimulator.js";
import { defaultViewerTab, ViewerTab } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { SimulatingIndicator } from "./SimulatingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  simulation: Simulation;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  showMenu?: boolean;
  defaultTab?: ViewerTab;
};

export type ViewerWithMenuBarHandle = {
  squiggleViewerHandle: SquiggleViewerHandle | null;
  setViewerTab: (tab: ViewerTab) => void;
};
/* Wrapper for SquiggleViewer that shows the rendering stats and isSimulating state. */
export const ViewerWithMenuBar = forwardRef<ViewerWithMenuBarHandle, Props>(
  function ViewerWithMenuBar(
    {
      simulation: simulation,
      playgroundSettings,
      showMenu = true,
      editor,
      defaultTab,
    },
    viewerWithMenuBarRef
  ) {
    const [viewerTab, setViewerTab] = useState<ViewerTab>(
      defaultTab ?? defaultViewerTab(simulation.output)
    );

    const viewerRef = useRef<SquiggleViewerHandle>(null);
    const { output } = simulation;

    useImperativeHandle(viewerWithMenuBarRef, () => ({
      squiggleViewerHandle: viewerRef.current,
      setViewerTab,
    }));

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
