import * as React from "react";
import { FC, useState } from "react";

import {
  Env,
  SqError,
  SqNumericFnPlot,
  SqDistFnPlot,
  SqLinearScale,
  SqLambda,
  SqNumberValue,
} from "@quri/squiggle-lang";

import {
  generateDistributionPlotSettings,
  generateFunctionPlotSettings,
} from "../ViewSettingsForm.js";

import { MessageAlert } from "../Alert.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";

import { DistFunctionChart } from "./DistFunctionChart.js";
import { NumericFunctionChart } from "./NumericFunctionChart.js";
import { functionChartDefaults } from "./utils.js";
import { ViewSettings } from "../ViewSettingsForm.js";
import { FunctionChartContainer } from "./FunctionChartContainer.js";

type FunctionChartProps = {
  fn: SqLambda;
  settings: ViewSettings;
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
      <FunctionChartContainer fn={fn}>
        <MessageAlert heading="Function Display Not Supported">
          Only functions with one parameter are displayed.
        </MessageAlert>
      </FunctionChartContainer>
    );
  }
  const result1 = fn.directCall([
    SqNumberValue.create(functionChartDefaults.min),
  ]);
  const result2 = fn.directCall([
    SqNumberValue.create(functionChartDefaults.max),
  ]);
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
        ...generateFunctionPlotSettings(settings),
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
        ...generateFunctionPlotSettings(settings),
        yScale: SqLinearScale.create(),
      });

      return <NumericFunctionChart plot={plot} height={height} />;
    }
    default:
      return (
        <FunctionChartContainer fn={fn}>
          <MessageAlert heading="Function Display Not Supported">
            There is no function visualization for this type of output:{" "}
            <span className="font-bold">{validResult.value.tag}</span>
          </MessageAlert>
        </FunctionChartContainer>
      );
  }
};
