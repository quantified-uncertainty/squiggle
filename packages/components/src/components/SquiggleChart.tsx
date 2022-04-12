import * as React from "react";
import _ from "lodash";
import { run, errorValueToString } from "@quri/squiggle-lang";
import type { samplingParams, exportEnv } from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistributionChart } from "./DistributionChart";
import { ErrorBox } from "./ErrorBox";

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

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  sampleCount = 1000,
  outputXYPoints = 1000,
  environment = [],
  onEnvChange = () => {},
  width = 500,
  height = 60,
}: SquiggleChartProps) => {
  let samplingInputs: samplingParams = {
    sampleCount: sampleCount,
    xyPointLength: outputXYPoints,
  };

  let expressionResult = run(squiggleString, samplingInputs, environment);
  if (expressionResult.tag === "Ok") {
    onEnvChange(environment);
    let expression = expressionResult.value;
    if (expression.tag === "number") {
      return <NumberShower precision={3} number={expression.value} />;
    } else if (expression.tag === "distribution") {
      return (
        <DistributionChart
          distribution={expression.value}
          height={height}
          width={width}
        />
      );
    } else {
      return (
        <ErrorBox heading="No Viewer">
          {"We don't currently have a viewer for this type: " + expression.tag}
        </ErrorBox>
      );
    }
  } else {
    // At this point, we came across an error. What was our error?
    return (
      <ErrorBox heading={"Parse Error"}>
        {errorValueToString(expressionResult.value)}
      </ErrorBox>
    );
  }
};
