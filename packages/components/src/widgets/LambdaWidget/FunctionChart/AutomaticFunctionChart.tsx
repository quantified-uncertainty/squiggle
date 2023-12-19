import { FC } from "react";

import {
  Env,
  result,
  SqDistFnPlot,
  SqLambda,
  SqLinearScale,
  SqNumericFnPlot,
  SqNumericRangeDomain,
} from "@quri/squiggle-lang";

import { MessageAlert } from "../../../components/Alert.js";
import { ErrorBoundary } from "../../../components/ErrorBoundary.js";
import {
  generateDistributionPlotSettings,
  PlaygroundSettings,
} from "../../../components/PlaygroundSettings.js";
import { DistFunctionChart } from "./DistFunctionChart.js";
import { NumericFunctionChart } from "./NumericFunctionChart.js";

type AutomaticFunctionChartProps = {
  fn: SqLambda;
  settings: PlaygroundSettings;
  environment: Env;
  height: number;
};

// // TODO - move to SquiggleErrorAlert with `collapsible` flag or other HOC, there's nothing specific about functions here
// const FunctionCallErrorAlert: FC<{ error: SqError }> = ({ error }) => {
//   const [expanded, setExpanded] = useState(false);

//   return (
//     <MessageAlert heading="Function Display Failed">
//       <div className="space-y-2">
//         <span
//           className="underline decoration-dashed cursor-pointer"
//           onClick={() => setExpanded(!expanded)}
//         >
//           {expanded ? "Hide" : "Show"} error details
//         </span>
//         {expanded ? <SquiggleErrorAlert error={error} /> : null}
//       </div>
//     </MessageAlert>
//   );
// };

function getValidInputOutputType(
  fn: SqLambda
): result<[string, string], string> {
  const signature = fn.signatures().find((s) => s.inputs.length === 1);

  if (!signature) {
    return {
      ok: false,
      value: "Only functions with one parameter are displayed.",
    };
  }

  const [inputType, outputType] = [
    signature.inputs[0]?.type,
    signature.outputType,
  ];
  const outputName = outputType?.getName();
  if (outputName !== "Number" && outputName !== "Dist") {
    return {
      ok: false,
      value: "Only functions with one parameter are displayed.",
    };
  }
  if (inputType?.getName() !== "Number" && inputType?.getName() !== "Date") {
    return {
      ok: false,
      value: "Only functions with one parameter are displayed.",
    };
  }
  return { ok: true, value: [inputType.getName(), outputName] };
}

export function canDisplayFunction(fn: SqLambda): boolean {
  return getValidInputOutputType(fn).ok;
}
//When no chart is given, the AutomaticFunctionChart tries to guess the best chart to use based on the function's output.
export const AutomaticFunctionChart: FC<AutomaticFunctionChartProps> = ({
  fn,
  settings,
  environment,
  height,
}) => {
  const getTypes = getValidInputOutputType(fn);
  if (!getTypes.ok) {
    return (
      <MessageAlert heading="Function Display Failed">
        {getTypes.value}
      </MessageAlert>
    );
  }
  const outputName = getTypes.value[1];

  const min: number = settings.functionChartSettings.start;
  const max: number = settings.functionChartSettings.stop;

  const signature = fn.signatures().find((s) => s.inputs.length === 1);

  //Remember: The only times that the inputType is known as Date happens when there's a date domain.
  const includedDomain = signature?.[0]?.domain;
  const xDomain = includedDomain
    ? includedDomain
    : SqNumericRangeDomain.fromMinMax(min, max);

  const yScale = SqLinearScale.create({});
  const xScale = xDomain.toDefaultScale();

  switch (outputName) {
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
  }
};
