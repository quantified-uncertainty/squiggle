import { ReactComponentElement, useState } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewer } from "../SquiggleViewer/index.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleOutput: SquiggleOutput;
  isRunning: boolean;
  editor?: CodeEditorHandle;
  viewer: (output: SqValue) => ReactComponentElement<typeof SquiggleViewer>;
} & PartialPlaygroundSettings;

export type ViewerMode =
  | "Imports"
  | "Exports"
  | "Variables"
  | "Result"
  | "AST"
  | { tag: "CustomResultPath"; value: SqValuePath };

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
export const ViewerMenuBar: React.FC<Props> = ({
  squiggleOutput,
  isRunning,
  viewer,
}) => {
  const { output } = squiggleOutput;
  const [mode, setMode] = useMode(output);

  return (
    <Layout
      menu={<ViewerMenu mode={mode} setMode={setMode} output={output} />}
      indicator={
        <RenderingIndicator isRunning={isRunning} output={squiggleOutput} />
      }
      viewer={
        <ViewerBody
          mode={mode}
          output={output}
          isRunning={isRunning}
          viewer={viewer}
        />
      }
    />
  );
};
