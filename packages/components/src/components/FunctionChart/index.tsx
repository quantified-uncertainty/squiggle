import { FC, useState } from "react";

import {
  Env,
  SqDistFnPlot,
  SqError,
  SqLinearScale,
  SqNumberValue,
  SqNumericFnPlot,
} from "@quri/squiggle-lang";
import { MessageAlert } from "../Alert.js";
import {
  PlaygroundSettings,
  generateDistributionPlotSettings,
} from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { DistFunctionChart } from "./DistFunctionChart.js";
import { NumericFunctionChart } from "./NumericFunctionChart.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { Calculator } from "../Calculator/index.js";
import {
  SqCalculatorValueWithContext,
  SqLambdaValueWithContext,
} from "../Calculator/types.js";
import { valueHasContext } from "../../lib/utility.js";

type FunctionChartProps = {
  fnValue: SqLambdaValueWithContext;
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
  fnValue,
  settings,
  environment,
  height,
}) => {
  const fn = fnValue.value;
  const parameters = fn.parameterCounts();
  const toCalc = () => {
    const foo = fnValue.toCalculator();
    if (foo && valueHasContext(foo)) {
      return (
        <Calculator
          valueWithContext={foo as SqCalculatorValueWithContext}
          environment={environment}
          settings={settings}
        />
      );
    } else {
      return undefined;
    }
  };
  if (!parameters.includes(1)) {
    const asCalc = toCalc();
    return asCalc ? (
      asCalc
    ) : (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }
  const signatures = fn.signatures();
  const domain = signatures[0][0]?.domain;

  const min = domain?.min ?? settings.functionChartSettings.start;
  const max = domain?.max ?? settings.functionChartSettings.stop;

  const xScale = SqLinearScale.create({ min, max });
  const yScale = SqLinearScale.create({});

  const result1 = fn.call([SqNumberValue.create(min)], environment);
  const result2 = fn.call([SqNumberValue.create(max)], environment);
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
    const asCalc = toCalc();
    return asCalc ? (
      asCalc
    ) : (
      <FunctionCallErrorAlert error={validResult.value} />
    );
  }

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
