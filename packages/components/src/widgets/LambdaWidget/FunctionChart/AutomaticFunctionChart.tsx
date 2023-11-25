import { FC, useState } from "react";

import {
  Env,
  SqDistFnPlot,
  SqDomain,
  SqError,
  SqLambda,
  SqLinearScale,
  SqNumericFnPlot,
  SqNumericRangeDomain,
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
import { SqValueResult } from "../../../components/SquiggleViewer/SquiggleValueResultViewer.js";

type AutomaticFunctionChartProps = {
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

function checkDomainBounds(
  domain: SqDomain,
  fn: SqLambda,
  environment
): SqValueResult {
  const result1 = fn.call([domain.minValue], environment);
  const result2 = fn.call([domain.maxValue], environment);

  const getValidResult = () => {
    if (result1.ok) {
      return result1;
    } else if (result2.ok) {
      return result2;
    } else {
      return result1;
    }
  };
  return getValidResult();
}

//When no chart is given, the AutomaticFunctionChart tries to guess the best chart to use based on the function's output.
export const AutomaticFunctionChart: FC<AutomaticFunctionChartProps> = ({
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

  const includedDomain = fn.signatures().find((s) => s.length === 1)?.[0]
    ?.domain;

  const xDomain = includedDomain
    ? includedDomain
    : SqNumericRangeDomain.fromMinMax(min, max);

  const domainBoundsResult = checkDomainBounds(xDomain, fn, environment);

  if (!domainBoundsResult.ok) {
    return <FunctionCallErrorAlert error={domainBoundsResult.value} />;
  }

  const yScale = SqLinearScale.create({});
  const xScale = xDomain.toDefaultScale();

  switch (domainBoundsResult.value.tag) {
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
          <span className="font-bold">{domainBoundsResult.value.tag}</span>
        </MessageAlert>
      );
  }
};
