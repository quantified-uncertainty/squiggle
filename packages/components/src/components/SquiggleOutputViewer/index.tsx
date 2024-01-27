import { forwardRef } from "react";

import { SquiggleProjectRun } from "../../lib/hooks/useSquiggleProjectRun.js";
import { getIsRunning } from "../../lib/hooks/useSquiggleRunner.js";
import { ViewerTab, viewerTabToValue } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import {
  SquiggleViewerHandle,
  ViewerProvider,
} from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleProjectRun: SquiggleProjectRun;
  editor?: CodeEditorHandle;
  setViewerTab: (viewerTab: ViewerTab) => void;
  viewerTab: ViewerTab;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  (
<<<<<<< HEAD
    { squiggleOutput, editor, viewerTab, setViewerTab, ...settings },
=======
    {
      squiggleProjectRun,
      editor,
      viewerTab,
      seed,
      setSeed,
      setViewerTab,
      ...settings
    },
>>>>>>> 2abd1c6f0 (SquiggleOutput -> SquiggleProjectRun)
    viewerRef
  ) => {
    const { output } = squiggleProjectRun;
    const isRunning = getIsRunning(squiggleProjectRun);

    return (
      <ViewerProvider
        partialPlaygroundSettings={settings}
        editor={editor}
        ref={viewerRef}
        rootValue={viewerTabToValue(viewerTab, output) || undefined}
      >
        <Layout
          menu={
            <ViewerMenu
              viewerTab={viewerTab}
              setViewerTab={setViewerTab}
              output={output}
            />
          }
<<<<<<< HEAD
          indicator={<RenderingIndicator output={squiggleOutput} />}
=======
          changeSeedAndRunButton={
            <RunSeedButton
              isRunning={isRunning}
              seed={seed}
              setSeed={setSeed}
            />
          }
          indicator={<RenderingIndicator output={squiggleProjectRun} />}
>>>>>>> 2abd1c6f0 (SquiggleOutput -> SquiggleProjectRun)
          viewer={
            <ViewerBody
              viewerTab={viewerTab}
              output={output}
              isRunning={isRunning}
            />
          }
        />
      </ViewerProvider>
    );
  }
);
SquiggleOutputViewer.displayName = "SquiggleOutputViewer";
