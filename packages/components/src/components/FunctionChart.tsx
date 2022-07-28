import * as React from "react";
import {
  lambdaValue,
  environment,
  runForeign,
  errorValueToString,
} from "@quri/squiggle-lang";
import { FunctionChart1Dist } from "./FunctionChart1Dist";
import { FunctionChart1Number } from "./FunctionChart1Number";
import { PlotSettings } from "./DistributionChart";
import { ErrorAlert, MessageAlert } from "./Alert";

export type FunctionSettings = {
  /** Where the function domain starts */
  start: number;
  /** Where the function domain ends */
  stop: number;
  /** The amount of stops sampled */
  count: number;
};

interface FunctionChartProps {
  fn: lambdaValue;
  functionSettings: FunctionSettings;
  plotSettings: PlotSettings;
  environment: environment;
  height: number;
}

export const functionSettingsFromPartial = (
  partial: Partial<FunctionSettings>
): FunctionSettings => {
  return {
    start: 0,
    stop: 10,
    count: 20,
    ...partial,
  };
};

export const FunctionChart: React.FC<FunctionChartProps> = ({
  fn,
  functionSettings,
  environment,
  plotSettings,
  height,
}) => {
  if (fn.parameters.length > 1) {
    return (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }
  const result1 = runForeign(fn, [functionSettings.start], environment);
  const result2 = runForeign(fn, [functionSettings.stop], environment);
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
          chartSettings={functionSettings}
          environment={environment}
          height={height}
          distributionPlotSettings={plotSettings}
        />
      );
    case "number":
      return (
        <FunctionChart1Number
          fn={fn}
          chartSettings={functionSettings}
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
