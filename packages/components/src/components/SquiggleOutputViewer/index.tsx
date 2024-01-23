import { forwardRef, useState } from "react";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { RunnerState } from "../../lib/hooks/useRunnerState.js";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
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
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
  runnerState: RunnerState;
} & PartialPlaygroundSettings;

export type ViewerMode = "Imports" | "Exports" | "Variables" | "Result" | "AST";

function useMode(outputResult: SqOutputResult) {
  return useState<ViewerMode>(() => {
    // Pick the initial mode value

    if (!outputResult.ok) {
      return "Variables";
    }

    const output = outputResult.value;
    if (output.result.tag !== "Void") {
      return "Result";
    }
    if (!output.exports.isEmpty()) {
      return "Exports";
    }
    return "Variables";
  });
}

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const SquiggleOutputViewer = forwardRef<SquiggleViewerHandle, Props>(
  (
    { squiggleOutput, isRunning, editor, runnerState, ...settings },
    viewerRef
  ) => {
    const { output } = squiggleOutput;
    const [mode, setMode] = useMode(output);

    return (
      <ViewerProvider
        partialPlaygroundSettings={settings}
        editor={editor}
        ref={viewerRef}
      >
        <Layout
          menu={<ViewerMenu mode={mode} setMode={setMode} output={output} />}
          indicator={
            <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
          }
          changeSeedAndRunButton={
            <RunSeedButton runnerState={runnerState} isRunning={isRunning} />
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
