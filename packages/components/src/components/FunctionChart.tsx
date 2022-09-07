import * as React from "react";
import { SqLambda, environment, SqValueTag } from "@quri/squiggle-lang";
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
  fn: SqLambda;
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
  const result1 = fn.call([chartSettings.start]);
  const result2 = fn.call([chartSettings.stop]);
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
      <ErrorAlert heading="Error">{validResult.value.toString()}</ErrorAlert>
    );
  }

  switch (validResult.value.tag) {
    case SqValueTag.Distribution:
      return (
        <FunctionChart1Dist
          fn={fn}
          chartSettings={chartSettings}
          environment={environment}
          height={height}
          distributionPlotSettings={distributionPlotSettings}
        />
      );
    case SqValueTag.Number:
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
