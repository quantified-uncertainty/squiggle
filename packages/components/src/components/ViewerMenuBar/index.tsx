import { useState } from "react";

import { SqValuePath } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

export type ViewerMode =
  | "Imports"
  | "Exports"
  | "Variables"
  | "Result"
  | "AST"
  | { tag: "CustomResultPath"; value: SqValuePath };

export function defaultMode(output: SqOutputResult): ViewerMode {
  if (!output.ok) {
    return "Variables";
  }

  const sqOutput = output.value;
  if (sqOutput.result.tag !== "Void") {
    return "Result";
  }
  if (!sqOutput.exports.isEmpty()) {
    return "Exports";
  }
  return "Variables";
}

export function useMode(outputResult: SqOutputResult) {
  return useState<ViewerMode>(() => defaultMode(outputResult));
}

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const ViewerMenuBar: React.FC<Props> = ({
  squiggleOutput,
  isRunning,
}) => {
  const { output } = squiggleOutput;
  const [mode, setMode] = useMode(output);

  return (
    <Layout
      menu={<ViewerMenu mode={mode} setMode={setMode} output={output} />}
      indicator={
        <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
      }
      viewer={<ViewerBody mode={mode} output={output} isRunning={isRunning} />}
    />
  );
};
