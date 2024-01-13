import { FC, useState } from "react";

import {
  Env,
  result,
  SqDistFnPlot,
  SqDomain,
  SqError,
  SqLambda,
  SqLambdaValue,
  SqNumericFnPlot,
  SqNumericRangeDomain,
} from "@quri/squiggle-lang";

import { MessageAlert } from "../../../components/Alert.js";
import { ErrorBoundary } from "../../../components/ErrorBoundary.js";
import { PlaygroundSettings } from "../../../components/PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../../../components/SquiggleErrorAlert.js";
import { DistFunctionChart } from "./DistFunctionChart.js";
import { NumericFunctionChart } from "./NumericFunctionChart.js";

type AutomaticFunctionChartProps = {
  fn: SqLambdaValue;
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
// Sees if it can get a valid result from either bounds of the domain.
function getInferredFnOutputType(
  domain: SqDomain,
  fn: SqLambda,
  environment: Env
): result<string, SqError> {
  const result1 = fn.call([domain.minValue], environment);
  if (result1.ok) {
    return { ok: true, value: result1.value.tag };
  }

  const result2 = fn.call([domain.maxValue], environment);
  if (result2.ok) {
    return { ok: true, value: result2.value.tag };
  } else {
    return { ok: false, value: result2.value };
  }
}

//When no chart is given, the AutomaticFunctionChart tries to guess the best chart to use based on the function's output.
export const AutomaticFunctionChart: FC<AutomaticFunctionChartProps> = ({
  fn,
  settings,
  environment,
  height,
}) => {
  const parameters = fn.value.parameterCounts();
  if (!parameters.includes(1)) {
    return (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }

  const min: number = settings.functionChartSettings.start;
  const max: number = settings.functionChartSettings.stop;
  const xCount: number = settings.functionChartSettings.count;

  const includedDomain = fn.value.signatures().find((s) => s.length === 1)?.[0]
    ?.domain;

  const xDomain = includedDomain
    ? includedDomain
    : SqNumericRangeDomain.fromMinMax(min, max);

  const inferredOutputType = getInferredFnOutputType(
    xDomain,
    fn.value,
    environment
  );

  if (!inferredOutputType.ok) {
    return <FunctionCallErrorAlert error={inferredOutputType.value} />;
  }

  const yScale = fn.defaultYScale();
  const xScale = fn.defaultXScale();

  switch (inferredOutputType.value) {
    case "Dist": {
      const plot = SqDistFnPlot.create({
        fn: fn.value,
        xScale,
        yScale,
        distXScale: yScale,
      });

      return (
        <DistFunctionChart
          plot={plot}
          environment={environment}
          height={height}
          xCount={xCount}
        />
      );
    }
    case "Number": {
      const plot = SqNumericFnPlot.create({
        fn: fn.value,
        xScale,
        yScale,
      });

      return (
        <ErrorBoundary>
          <NumericFunctionChart
            plot={plot}
            environment={environment}
            height={height}
            xCount={xCount}
          />
        </ErrorBoundary>
      );
    }
    default:
      return (
        <MessageAlert heading="Function Display Not Supported">
          There is no function visualization for this type of output:{" "}
          <span className="font-bold">{inferredOutputType.value}</span>
        </MessageAlert>
      );
  }
};
