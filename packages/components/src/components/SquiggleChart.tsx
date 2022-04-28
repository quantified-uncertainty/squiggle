import * as React from "react";
import _ from "lodash";
import styled from "styled-components";
import {
  run,
  errorValueToString,
  squiggleExpression,
} from "@quri/squiggle-lang";
import type { samplingParams } from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistributionChart } from "./DistributionChart";
import { ErrorBox } from "./ErrorBox";
import useSize from "@react-hook/size";

const variableBox = {
  Component: styled.div`
    background: white;
    border: 1px solid #eee;
    border-radius: 2px;
    margin-bottom: 0.4em;
  `,
  Heading: styled.div`
    border-bottom: 1px solid #eee;
    padding-left: 0.8em;
    padding-right: 0.8em;
    padding-top: 0.1em;
  `,
  Body: styled.div`
    padding: 0.4em 0.8em;
  `,
};

export const VariableBox: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => {
  return (
    <variableBox.Component>
      <variableBox.Heading>
        <h3>{heading}</h3>
      </variableBox.Heading>
      <variableBox.Body>{children}</variableBox.Body>
    </variableBox.Component>
  );
};

export interface SquiggleItemProps {
  /** The input string for squiggle */
  expression: squiggleExpression;
  width: number;
  height: number;
}

const SquiggleItem: React.FC<SquiggleItemProps> = ({
  expression,
  width,
  height,
}: SquiggleItemProps) => {
  switch (expression.tag) {
    case "number":
      return (
        <VariableBox heading="Number">
          <NumberShower precision={3} number={expression.value} />
        </VariableBox>
      );
    case "distribution": {
      let distType = expression.value.type();
      return (
        <VariableBox heading={`Distribution (${distType})`}>
          {distType === "Symbolic" ? (
            <>
              <div>{expression.value.toString()}</div>
            </>
          ) : (
            <></>
          )}
          <DistributionChart
            distribution={expression.value}
            height={height}
            width={width}
          />
        </VariableBox>
      );
    }
    case "string":
      return (
        <VariableBox heading="String">{`"${expression.value}"`}</VariableBox>
      );
    case "boolean":
      return (
        <VariableBox heading="Boolean">
          {expression.value.toString()}
        </VariableBox>
      );
    case "symbol":
      return <VariableBox heading="Symbol">{expression.value}</VariableBox>;
    case "call":
      return <VariableBox heading="Call">{expression.value}</VariableBox>;
    case "array":
      return (
        <VariableBox heading="Array">
          {expression.value.map((r) => (
            <SquiggleItem expression={r} width={width - 20} height={50} />
          ))}
        </VariableBox>
      );
    default:
      return (
        <ErrorBox heading="No Viewer">
          {"We don't currently have a working viewer for record types."}
        </ErrorBox>
      );
  }
};

export interface SquiggleChartProps {
  /** The input string for squiggle */
  squiggleString?: string;
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
  /** variables declared before this expression */
  environment?: unknown;
  /** When the environment changes */
  onChange?(expr: squiggleExpression): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
}

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  sampleCount = 1000,
  outputXYPoints = 1000,
  onChange = () => {},
  height = 60,
  width = NaN,
}: SquiggleChartProps) => {
  const target = React.useRef(null);
  const [componentWidth] = useSize(target);
  // I would have wanted to just use componentWidth, but this created infinite loops with SquiggleChart.stories.
  //So you can manually add a width, as an escape hatch.
  let _width = width || componentWidth;
  let samplingInputs: samplingParams = {
    sampleCount: sampleCount,
    xyPointLength: outputXYPoints,
  };
  let expressionResult = run(squiggleString, samplingInputs);
  let internal: JSX.Element;
  if (expressionResult.tag === "Ok") {
    let expression = expressionResult.value;
    onChange(expression);
    internal = (
      <SquiggleItem expression={expression} width={_width} height={height} />
    );
  } else {
    // At this point, we came across an error. What was our error?
    internal = (
      <ErrorBox heading={"Parse Error"}>
        {errorValueToString(expressionResult.value)}
      </ErrorBox>
    );
  }
  return <div ref={target}>{internal}</div>;
};
