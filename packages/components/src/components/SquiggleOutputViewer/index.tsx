import { forwardRef } from "react";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
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
  squiggleOutput: SquiggleOutput;
  editor?: CodeEditorHandle;
  setViewerTab: (viewerTab: ViewerTab) => void;
  viewerTab: ViewerTab;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  (
    { squiggleOutput, editor, viewerTab, setViewerTab, ...settings },
    viewerRef
  ) => {
    const { output } = squiggleOutput;
    const isRunning = getIsRunning(squiggleOutput);

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
          indicator={<RenderingIndicator output={squiggleOutput} />}
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
