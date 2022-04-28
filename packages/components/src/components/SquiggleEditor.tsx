import * as React from "react";
import * as ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import { CodeEditor } from "./CodeEditor";
import styled from "styled-components";
import type { squiggleExpression } from "@quri/squiggle-lang";

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
  environment?: unknown;
  /** when the environment changes. Used again for notebook magic*/
  onChange?(expr: squiggleExpression): void;
  /** The width of the element */
  width: number;
}

const Input = styled.div`
  border: 1px solid #ddd;
  padding: 0.3em 0.3em;
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
  onChange,
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
          showGutter={false}
          height={20}
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
        onChange={onChange}
      />
    </div>
  );
};

export function renderSquiggleEditorToDom(props: SquiggleEditorProps) {
  let parent = document.createElement("div");
  ReactDOM.render(
    <SquiggleEditor
      {...props}
      onChange={(expr) => {
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
        parent.value = expr;

        parent.dispatchEvent(new CustomEvent("input"));
        if (props.onChange) props.onChange(expr);
      }}
    />,
    parent
  );
  return parent;
}
