import * as React from "react";
import _ from "lodash";
import { run } from "@quri/squiggle-lang";
import type {
  SamplingInputs,
  exportEnv,
  exportDistribution,
} from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistPlusChart } from "./DistPlusChart";
import { FunctionChart } from "./FunctionChart";
import { Error } from "./Error";

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
  kernelWidth,
  pointDistLength = 1000,
  diagramStart = 0,
  diagramStop = 10,
  diagramCount = 20,
  environment = [],
  onEnvChange = () => {},
  width = 500,
  height = 60,
}: SquiggleChartProps) => {
  let samplingInputs: SamplingInputs = {
    sampleCount: sampleCount,
    outputXYPoints: outputXYPoints,
    kernelWidth: kernelWidth,
    pointDistLength: pointDistLength,
  };

  let result = run(squiggleString, samplingInputs, environment);
  if (result.tag === "Ok") {
    let environment = result.value.environment;
    let exports = result.value.exports;
    onEnvChange(environment);
    let chartResults = exports.map((chartResult: exportDistribution) => {
      if (chartResult["NAME"] === "Float") {
        return <NumberShower precision={3} number={chartResult["VAL"]} />;
      } else if (chartResult["NAME"] === "DistPlus") {
        return (
          <DistPlusChart
            distPlus={chartResult.VAL}
            height={height}
            width={width}
          />
        );
      } else if (chartResult.NAME === "Function") {
        return (
          <FunctionChart
            distPlusFn={chartResult.VAL}
            diagramStart={diagramStart}
            diagramStop={diagramStop}
            diagramCount={diagramCount}
          />
        );
      }
    });
    return <>{chartResults}</>;
  } else if (result.tag === "Error") {
    // At this point, we came across an error. What was our error?
    return <Error heading={"Parse Error"}>{result.value}</Error>;
  }
};
