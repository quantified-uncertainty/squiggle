import * as React from "react";
import * as ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import { CodeEditor } from "./CodeEditor";
import type { exportEnv } from "@quri/squiggle-lang";
import styled from 'styled-components'

export interface SquiggleEditorProps {
  /** The input string for squiggle */
  initialSquiggleString?: string;
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** The amount of points returned to draw the distribution */
  outputXYPoints?: number;
  kernelWidth?: number;
  pointDistLength?: number;
  /** If the result is a function, where the function starts */
  diagramStart?: number;
  /** If the result is a function, where the function ends */
  diagramStop?: number;
  /** If the result is a function, how many points along the function it samples */
  diagramCount?: number;
  /** The environment, other variables that were already declared */
  environment?: exportEnv;
  /** when the environment changes. Used again for notebook magic*/
  onEnvChange?(env: exportEnv): void;
  /** The width of the element */
  width: number;
}

const Input = styled.div`
  border: 1px solid #ddd;
  padding: 0.1em 0.1em;
  margin-bottom: 1em;
`;

export let SquiggleEditor: React.FC<SquiggleEditorProps> = ({
  initialSquiggleString = "",
  width = 500,
  sampleCount,
  outputXYPoints,
  kernelWidth,
  pointDistLength,
  diagramStart,
  diagramStop,
  diagramCount,
  onEnvChange,
  environment,
}: SquiggleEditorProps) => {
  let [expression, setExpression] = React.useState(initialSquiggleString);
  return (
    <div>
      <Input>
        <CodeEditor
          value={expression}
          onChange={setExpression}
          oneLine={true}
        />
      </Input>
      <SquiggleChart
        width={width}
        squiggleString={expression}
        sampleCount={sampleCount}
        outputXYPoints={outputXYPoints}
        kernelWidth={kernelWidth}
        pointDistLength={pointDistLength}
        diagramStart={diagramStart}
        diagramStop={diagramStop}
        diagramCount={diagramCount}
        environment={environment}
        onEnvChange={onEnvChange}
      />
    </div>
  );
};

export function renderSquiggleEditorToDom(props: SquiggleEditorProps) {
  let parent = document.createElement("div");
  ReactDOM.render(
    <SquiggleEditor
      {...props}
      onEnvChange={(env) => {
        // Typescript complains on two levels here.
        //  - Div elements don't have a value property
        //  - Even if it did (like it was an input element), it would have to
        //    be a string
        //
        //  Which are reasonable in most web contexts.
        //
        //  However we're using observable, neither of those things have to be
        //  true there. div elements can contain the value property, and can have
        //  the value be any datatype they wish.
        //
        //  This is here to get the 'viewof' part of:
        //  viewof env = cell('normal(0,1)')
        //  to work
        // @ts-ignore
        parent.value = env;

        parent.dispatchEvent(new CustomEvent("input"));
        if (props.onEnvChange) props.onEnvChange(env);
      }}
    />,
    parent
  );
  return parent;
}
