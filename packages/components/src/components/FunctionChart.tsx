import * as React from "react";
import {
  SqLambda,
  environment,
  SqValueTag,
  SqError,
} from "@quri/squiggle-lang";
import { FunctionChart1Dist } from "./FunctionChart1Dist";
import { FunctionChart1Number } from "./FunctionChart1Number";
import { DistributionChartSettings } from "./DistributionChart";
import { MessageAlert } from "./Alert";
import { SquiggleErrorAlert } from "./SquiggleErrorAlert";

export type FunctionChartSettings = {
  start: number;
  stop: number;
  count: number;
};

interface FunctionChartProps {
  fn: SqLambda;
  chartSettings: FunctionChartSettings;
  distributionChartSettings: DistributionChartSettings;
  environment: environment;
  height: number;
}

const FunctionCallErrorAlert = ({ error }: { error: SqError }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (expanded) {
  }
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

export const FunctionChart: React.FC<FunctionChartProps> = ({
  fn,
  chartSettings,
  environment,
  distributionChartSettings,
  height,
}) => {
  console.log(fn.parameters().length);
  if (fn.parameters().length !== 1) {
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
    return <FunctionCallErrorAlert error={validResult.value} />;
  }

  switch (validResult.value.tag) {
    case SqValueTag.Distribution:
      return (
        <FunctionChart1Dist
          fn={fn}
          chartSettings={chartSettings}
          environment={environment}
          height={height}
          distributionChartSettings={distributionChartSettings}
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
