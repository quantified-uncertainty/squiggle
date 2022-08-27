import * as React from "react";
import { LambdaValue, environment, runForeign } from "@quri/squiggle-lang";
import { FunctionChart1Dist } from "./FunctionChart1Dist";
import { FunctionChart1Number } from "./FunctionChart1Number";
import { DistributionPlottingSettings } from "./DistributionChart";
import { ErrorAlert, MessageAlert } from "./Alert";

export type FunctionChartSettings = {
  start: number;
  stop: number;
  count: number;
};

interface FunctionChartProps {
  fn: LambdaValue;
  chartSettings: FunctionChartSettings;
  distributionPlotSettings: DistributionPlottingSettings;
  environment: environment;
  height: number;
}

export const FunctionChart: React.FC<FunctionChartProps> = ({
  fn,
  chartSettings,
  environment,
  distributionPlotSettings,
  height,
}) => {
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

  if (validResult.tag === "Error") {
    return (
      <ErrorAlert heading="Error">
        {errorValueToString(validResult.value)}
      </ErrorAlert>
    );
  }

  switch (validResult.value.tag) {
    case "distribution":
      return (
        <FunctionChart1Dist
          fn={fn}
          chartSettings={chartSettings}
          environment={environment}
          height={height}
          distributionPlotSettings={distributionPlotSettings}
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
        <MessageAlert heading="Function Display Not Supported">
          There is no function visualization for this type of output:{" "}
          <span className="font-bold">{validResult.value.tag}</span>
        </MessageAlert>
      );
  }
};
