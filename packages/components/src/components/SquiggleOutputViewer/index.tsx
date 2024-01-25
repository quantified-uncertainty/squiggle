import { forwardRef } from "react";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { ViewerMode } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import {
  SquiggleViewerHandle,
  ViewerProvider,
} from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { modeToValue, ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
  setMode: (mode: ViewerMode) => void;
  mode: ViewerMode;
} & PartialPlaygroundSettings;

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  (
    { squiggleOutput, isRunning, editor, mode, setMode, ...settings },
    viewerRef
  ) => {
    const { output } = squiggleOutput;

    return (
      <ViewerProvider
        partialPlaygroundSettings={settings}
        editor={editor}
        ref={viewerRef}
        rootValue={modeToValue(mode, output) || undefined}
      >
        <Layout
          menu={<ViewerMenu mode={mode} setMode={setMode} output={output} />}
          indicator={
            <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
          }
          viewer={
            <ViewerBody mode={mode} output={output} isRunning={isRunning} />
          }
        />
      </ViewerProvider>
    );
  }
);
SquiggleOutputViewer.displayName = "SquiggleOutputViewer";
