import * as React from "react";
import { lambdaValue, environment, runForeign } from "@quri/squiggle-lang";
import { FunctionChart1Dist } from "./FunctionChart1Dist";
import { FunctionChart1Number } from "./FunctionChart1Number";
import { ErrorAlert, MessageAlert } from "./Alert";

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
  if (fn.parameters.length > 1) {
    return (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }
  const result1 = runForeign(fn, [chartSettings.start], environment);
  const result2 = runForeign(fn, [chartSettings.stop], environment);
  const getValidResult = () => {
    if (result1.tag === "Ok") {
      return result1;
    } else if (result2.tag === "Ok") {
      return result2;
    } else {
      return result1;
    }
  };
  const validResult = getValidResult();
  const resultType =
    validResult.tag === "Ok" ? validResult.value.tag : ("Error" as const);

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
        <ErrorAlert heading="Error">The function failed to be run</ErrorAlert>
      );
    default:
      return (
        <MessageAlert heading="Function Display Not Supported">
          There is no function visualization for this type of output:{" "}
          <span className="font-bold">{resultType}</span>
        </MessageAlert>
      );
  }
};
