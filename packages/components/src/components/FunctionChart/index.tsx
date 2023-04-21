import * as React from "react";
import { FC, useState } from "react";
import * as yup from "yup";

import { Env, SqError, SqFnPlot, SqLinearScale } from "@quri/squiggle-lang";

import { MessageAlert } from "../Alert.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";

import { FunctionChart1Dist } from "./FunctionChart1Dist.js";
import { FunctionChart1Number } from "./FunctionChart1Number.js";
import { functionChartDefaults } from "./utils.js";

export const functionSettingsSchema = yup.object({}).shape({
  count: yup.number().required().positive().integer().default(20).min(2),
});

type FunctionChartProps = {
  plot: SqFnPlot;
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
  plot,
  environment,
  height,
}) => {
  if (plot.fn.parameters().length !== 1) {
    return (
      <MessageAlert heading="Function Display Not Supported">
        Only functions with one parameter are displayed.
      </MessageAlert>
    );
  }
  const xSqScale = plot.xScale ?? SqLinearScale.create();
  const result1 = plot.fn.call([xSqScale.min ?? functionChartDefaults.min]);
  const result2 = plot.fn.call([xSqScale.max ?? functionChartDefaults.max]);
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
    case "Dist":
      return (
        <FunctionChart1Dist
          plot={plot}
          environment={environment}
          height={height}
        />
      );
    case "Number":
      return <FunctionChart1Number plot={plot} height={height} />;
    default:
      return (
        <MessageAlert heading="Function Display Not Supported">
          There is no function visualization for this type of output:{" "}
          <span className="font-bold">{validResult.value.tag}</span>
        </MessageAlert>
      );
  }
};
