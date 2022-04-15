import * as React from "react";
import _ from "lodash";
import styled from "styled-components";
import {
  run,
  errorValueToString,
  squiggleExpression,
} from "@quri/squiggle-lang";
import type { samplingParams, exportEnv } from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistributionChart } from "./DistributionChart";
import { ErrorBox } from "./ErrorBox";
import useSize from "@react-hook/size";

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
  environment?: exportEnv;
  /** When the environment changes */
  onEnvChange?(env: exportEnv): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
}

export interface SquiggleItemProps {
  /** The input string for squiggle */
  expression: squiggleExpression;
  width: number;
  height: number;
}

const ShowBox = styled.div`
  background: white;
  border: 1px solid #eee;
  border-radius: 2px;
  margin-bottom: 0.4em;
`;

const ShowBoxHeading = styled.div`
  border-bottom: 1px solid #eee;
  padding-left: 0.8em;
  padding-right: 0.8em;
  padding-top: 0.1em;
`;

const ShowBoxPadding = styled.div`
  padding: 0.4em 0.8em;
`;

export const Box: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => {
  return (
    <ShowBox>
      <ShowBoxHeading>
        <h3>{heading}</h3>
      </ShowBoxHeading>
      <ShowBoxPadding>{children}</ShowBoxPadding>
    </ShowBox>
  );
};

const SquiggleItem: React.FC<SquiggleItemProps> = ({
  expression,
  width,
  height,
}: SquiggleItemProps) => {
  if (expression.tag === "number") {
    return (
      <Box heading="Number">
        <NumberShower precision={3} number={expression.value} />
      </Box>
    );
  } else if (expression.tag === "distribution") {
    let distType = expression.value.type();
    return (
      <Box heading={`Distribution (${distType})`}>
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
      </Box>
    );
  } else if (expression.tag === "string") {
    return <Box heading="String">{`"${expression.value}"`}</Box>;
  } else if (expression.tag === "boolean") {
    return (
      <Box heading="Boolean">
        ({expression.value == true ? "True" : "False"})
      </Box>
    );
  } else if (expression.tag === "symbol") {
    return <Box heading="Symbol">({expression.value})</Box>;
  } else if (expression.tag === "call") {
    return <Box heading="Call">({expression.value})</Box>;
  } else if (expression.tag === "array") {
    return (
      <Box heading="Array">
        <div>
          {expression.value.map((r) => (
            <SquiggleItem expression={r} width={width - 20} height={50} />
          ))}
        </div>
      </Box>
    );
  } else {
    return (
      <ErrorBox heading="No Viewer">
        {"We don't currently have a viewer for record types."}
      </ErrorBox>
    );
  }
};

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  sampleCount = 1000,
  outputXYPoints = 1000,
  environment = [],
  onEnvChange = () => {},
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
  let expressionResult = run(squiggleString, samplingInputs, environment);
  let internal: JSX.Element;
  if (expressionResult.tag === "Ok") {
    onEnvChange(environment);
    let expression = expressionResult.value;
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
