import * as React from "react";
import { lambdaValue, environment, runForeign, errorValueToString } from "@quri/squiggle-lang";
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
  let result1 = runForeign(fn, [chartSettings.start], environment);
  let result2 = runForeign(fn, [chartSettings.stop], environment);
  let getValidResult = () => {
    if (result1.tag === "Ok") {
      return result1;
    } else if (result2.tag === "Ok") {
      return result2;
    } else {
      return result1;
    }
  };
  let validResult = getValidResult();

  let component = () => {
    switch (validResult.tag) {
      case "Ok": {
        switch (validResult.value.tag) {
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
          default:
            return (
              <ErrorBox heading="No Viewer">
                There is no function visualization for this type of function
              </ErrorBox>
            );
        }
      }
      case "Error": {
        return (
          <ErrorBox heading="Error">The function failed to be run {errorValueToString(validResult.value)}</ErrorBox>
        );
      }
    }
  };

  return component();
};
