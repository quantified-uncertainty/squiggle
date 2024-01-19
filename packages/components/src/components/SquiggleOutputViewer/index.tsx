import { forwardRef, useState } from "react";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { getResultExports, getResultValue } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/index.js";
import { ViewerProvider } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

export type ViewerMode = "Imports" | "Exports" | "Variables" | "Result";

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  ({ squiggleOutput, isRunning, editor, ...settings }, viewerRef) => {
    const resultItem = getResultValue(squiggleOutput);
    const resultExports = getResultExports(squiggleOutput);

    const hasResult = Boolean(resultItem?.ok);
    const exportsCount = resultExports?.ok
      ? resultExports.value.value.entries().length
      : 0;

    const [mode, setMode] = useState<ViewerMode>(
      hasResult ? "Result" : exportsCount > 0 ? "Exports" : "Variables"
    );

    return (
      <ViewerProvider
        partialPlaygroundSettings={settings}
        editor={editor}
        ref={viewerRef}
      >
        <Layout
          menu={
            <ViewerMenu mode={mode} setMode={setMode} output={squiggleOutput} />
          }
          indicator={
            <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
          }
          viewer={
            <ViewerBody
              mode={mode}
              squiggleOutput={squiggleOutput}
              isRunning={isRunning}
            />
          }
        />
      </ViewerProvider>
    );
  }
);
SquiggleOutputViewer.displayName = "SquiggleOutputViewer";
