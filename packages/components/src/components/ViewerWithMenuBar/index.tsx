import { forwardRef } from "react";

import {
  isRunning,
  SquiggleProjectRun,
} from "../../lib/hooks/useSquiggleProjectRun.js";
import { ViewerTab } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleProjectRun: SquiggleProjectRun;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  viewerRef?: React.ForwardedRef<SquiggleViewerHandle>;
  viewerTab: ViewerTab;
  setViewerTab: (viewerTab: ViewerTab) => void;
};

// export function useMode(outputResult: SqOutputResult) {
//   return useState<ViewerMode>(() => defaultMode(outputResult));
// }

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const ViewerWithMenuBar = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerWithMenuBar(
    { squiggleProjectRun, playgroundSettings, viewerTab, setViewerTab, editor },
    viewerRef
  ) {
    const { output } = squiggleProjectRun;

    return (
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
            isRunning={isRunning(squiggleProjectRun)}
            playgroundSettings={playgroundSettings}
            ref={viewerRef}
            editor={editor}
          />
        }
      />
    );
  }
);
