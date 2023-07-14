import { FC, useState } from "react";

import {
  Env,
  SqDistFnPlot,
  SqError,
  SqLambda,
  SqLinearScale,
  SqNumberValue,
  SqNumericFnPlot,
} from "@quri/squiggle-lang";

import { MessageAlert } from "../Alert.js";
import {
  PlaygroundSettings,
  generateDistributionPlotSettings,
  generateFunctionPlotSettings,
} from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { DistFunctionChart } from "./DistFunctionChart.js";
import { NumericFunctionChart } from "./NumericFunctionChart.js";
import { functionChartDefaults } from "./utils.js";

type FunctionChartProps = {
  fn: SqLambda;
  settings: PlaygroundSettings;
  environment: Env;
  height: number;
};

// TODO - move to SquiggleErrorAlert with `collapsible` flag or other HOC, there's nothing specific about functions here
const FunctionCallErrorAlert: FC<{ error: SqError }> = ({ error }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <MessageAlert heading="Function Display Failed">
      <div className="space-y-2">
        <span
          className="underline decoration-dashed cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Show"} error details
        </span>
        {expanded ? <SquiggleErrorAlert error={error} /> : null}
      </div>
    </MessageAlert>
  );
};

export const FunctionChart: FC<FunctionChartProps> = ({
  fn,
  settings,
  environment,
  height,
}) => {
  if (fn.parameters().length !== 1) {
    return (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }
  const domain = fn.parameters()[0].domain;

  const result1 = fn.call(
    [SqNumberValue.create(functionChartDefaults.min)],
    environment
  );
  const result2 = fn.call(
    [SqNumberValue.create(functionChartDefaults.max)],
    environment
  );
  const getValidResult = () => {
    if (result1.ok) {
      return result1;
    } else if (result2.ok) {
      return result2;
    } else {
      return result1;
    }
  };
  const validResult = getValidResult();

  if (!validResult.ok) {
    return <FunctionCallErrorAlert error={validResult.value} />;
  }

  switch (validResult.value.tag) {
    case "Dist": {
      const plot = SqDistFnPlot.create({
        fn,
        ...(domain
          ? {
              xScale: SqLinearScale.create({
                min: domain.min,
                max: domain.max,
              }),
              points: settings.functionChartSettings.count,
            }
          : generateFunctionPlotSettings(settings)),
        distXScale: generateDistributionPlotSettings(
          settings.distributionChartSettings
        ).xScale,
      });

      return (
        <DistFunctionChart
          plot={plot}
          environment={environment}
          height={height}
        />
      );
    }
    case "Number": {
      const plot = SqNumericFnPlot.create({
        fn,
        ...(domain
          ? {
              xScale: SqLinearScale.create({
                min: domain.min,
                max: domain.max,
              }),
              points: settings.functionChartSettings.count,
            }
          : generateFunctionPlotSettings(settings)),
        yScale: SqLinearScale.create(),
      });

      return (
        <NumericFunctionChart
          plot={plot}
          height={height}
          environment={environment}
        />
      );
    }
    default:
      return (
        <MessageAlert heading="Function Display Not Supported">
          There is no function visualization for this type of output:{" "}
          <span className="font-bold">{validResult.value.tag}</span>
        </MessageAlert>
      );
  }
};
