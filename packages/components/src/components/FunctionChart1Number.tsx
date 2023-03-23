import * as React from "react";
import _ from "lodash";
import { FC, useMemo } from "react";
import { createClassFromSpec } from "react-vega";
import type { Spec } from "vega";

import { SqLambda } from "@quri/squiggle-lang";

import * as lineChartSpec from "../vega-specs/spec-line-chart.json";
import { ErrorAlert } from "./Alert";
import { FunctionChartSettings } from "./FunctionChart";

const SquiggleLineChart = createClassFromSpec({
  spec: lineChartSpec as Spec,
});

function rangeByCount(start: number, stop: number, count: number) {
  const step = (stop - start) / (count - 1);
  const items = _.range(start, stop, step);
  const result = items.concat([stop]);
  return result;
}

function getFunctionImage({
  settings,
  fn,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
}) {
  const chartPointsToRender = rangeByCount(
    settings.start,
    settings.stop,
    settings.count
  );

  let functionImage: { x: number; y: number }[] = [];
  let errors: { x: number; value: string }[] = [];

  for (const x of chartPointsToRender) {
    const result = fn.call([x]);
    if (result.ok) {
      if (result.value.tag === "Number") {
        functionImage.push({ x, y: result.value.value });
      } else {
        errors.push({ x, value: "This component expected number outputs" });
      }
    } else {
      errors.push({ x, value: result.value.toString() });
    }
  }

  return { errors, functionImage };
}

type FunctionChart1NumberProps = {
  fn: SqLambda;
  settings: FunctionChartSettings;
  height: number;
};

export const FunctionChart1Number: FC<FunctionChart1NumberProps> = ({
  fn,
  settings,
  height,
}) => {
  const { functionImage, errors } = useMemo(
    () => getFunctionImage({ settings, fn }),
    [settings, fn]
  );

  return (
    <>
      <SquiggleLineChart
        data={{ facet: functionImage }}
        height={height}
        actions={false}
      />
      <div className="space-y-1">
        {errors.map(({ x, value }) => (
          // TODO - group errors with identical value
          <ErrorAlert key={x} heading={value}>
            Error at point {x}
          </ErrorAlert>
        ))}
      </div>
    </>
  );
};
