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
import { RunSeedButton } from "./RunSeedButton.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleProjectRun: SquiggleProjectRun;
  editor?: CodeEditorHandle;
  seed: string;
  setSeed: (seed: string) => void;
  setViewerTab: (viewerTab: ViewerTab) => void;
  viewerTab: ViewerTab;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  (
    {
      squiggleProjectRun,
      editor,
      viewerTab,
      seed,
      setSeed,
      setViewerTab,
      ...settings
    },
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
          changeSeedAndRunButton={
            <RunSeedButton
              isRunning={isRunning}
              seed={seed}
              setSeed={setSeed}
            />
          }
          indicator={<RenderingIndicator output={squiggleProjectRun} />}
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
