import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import {
  Distribution,
  result,
  lambdaValue,
  environment,
  runForeign,
} from "@quri/squiggle-lang";
import { FunctionChart1Dist } from "./FunctionChart1Dist";
import { FunctionChart1Number } from "./FunctionChart1Number";
import { ErrorBox } from "./ErrorBox";

export type FunctionChartSettings = {
  start: number;
  stop: number;
  count: number;
};

interface FunctionChartProps {
  fn: lambdaValue;
  chartSettings: FunctionChartSettings;
  environment: environment;
  height: number;
}

export const FunctionChart: React.FC<FunctionChartProps> = ({
  fn,
  chartSettings,
  environment,
  height,
}: FunctionChartProps) => {
  let result = runForeign(fn, [chartSettings.start], environment);
  let resultType = result.tag === "Ok" ? result.value.tag : "Error";

  let comp = () => {
    switch (resultType) {
      case "distribution":
        return (
          <FunctionChart1Dist
            fn={fn}
            chartSettings={chartSettings}
            environment={environment}
            height={height}
          />
        );
      case "number":
        return (
          <FunctionChart1Number
            fn={fn}
            chartSettings={chartSettings}
            environment={environment}
            height={height}
          />
        );
      case "Error":
        return (
          <ErrorBox heading="Error">The function failed to be run</ErrorBox>
        );
      default:
        return (
          <ErrorBox heading="No Viewer">
            There is no function visualization for this type of function
          </ErrorBox>
        );
    }
  };

  return comp();
};
