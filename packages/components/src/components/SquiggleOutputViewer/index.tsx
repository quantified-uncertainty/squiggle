import { forwardRef } from "react";

import {
  isRunning,
  SquiggleProjectRun,
} from "../../lib/hooks/useSquiggleProjectRun.js";
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
    { squiggleProjectRun, editor, viewerTab, setViewerTab, ...settings },
    viewerRef
  ) => {
    const { output } = squiggleProjectRun;
    const _isRunning = isRunning(squiggleProjectRun);

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
          indicator={<RenderingIndicator output={squiggleProjectRun} />}
          viewer={
            <ViewerBody
              viewerTab={viewerTab}
              output={output}
              isRunning={_isRunning}
            />
          }
        />
      </ViewerProvider>
    );
  }
);
SquiggleOutputViewer.displayName = "SquiggleOutputViewer";
