import { FC, useState } from "react";

import {
  Env,
  SqDistFnPlot,
  SqError,
  SqLambda,
  SqLinearScale,
  SqNumericFnPlot,
} from "@quri/squiggle-lang";

import { MessageAlert } from "../../../components/Alert.js";
import { ErrorBoundary } from "../../../components/ErrorBoundary.js";
import {
  PlaygroundSettings,
  generateDistributionPlotSettings,
} from "../../../components/PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../../../components/SquiggleErrorAlert.js";
import { DistFunctionChart } from "./DistFunctionChart.js";
import { NumericFunctionChart } from "./NumericFunctionChart.js";

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
  const parameters = fn.parameterCounts();
  if (!parameters.includes(1)) {
    return (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }

  const min: number = settings.functionChartSettings.start;
  const max: number = settings.functionChartSettings.stop;

  const signatures = fn.signatures();
  const domain = signatures[0][0]?.domain;

  const xScale =
    domain?.toDefaultScale({ min, max }) || SqLinearScale.create({ min, max });

  const result1 = fn.call([xScale.numberToValue(min)], environment);
  const result2 = fn.call([xScale.numberToValue(max)], environment);

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

  const yScale = SqLinearScale.create({});

  switch (validResult.value.tag) {
    case "Dist": {
      const plot = SqDistFnPlot.create({
        fn,
        xScale,
        yScale,
        points: settings.functionChartSettings.count,
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
        xScale,
        points: settings.functionChartSettings.count,
        yScale: SqLinearScale.create(),
      });

      return (
        <ErrorBoundary>
          <NumericFunctionChart
            plot={plot}
            environment={environment}
            height={height}
          />
        </ErrorBoundary>
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
