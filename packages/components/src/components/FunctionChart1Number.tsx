import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import { result, SqLambda, SqValueTag } from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as lineChartSpec from "../vega-specs/spec-line-chart.json";
import { ErrorAlert } from "./Alert";
import { FunctionChartSettings } from "./FunctionChart";

let SquiggleLineChart = createClassFromSpec({
  spec: lineChartSpec as Spec,
});

const _rangeByCount = (start: number, stop: number, count: number) => {
  const step = (stop - start) / (count - 1);
  const items = _.range(start, stop, step);
  const result = items.concat([stop]);
  return result;
};

type FunctionChart1NumberProps = {
  fn: SqLambda;
  settings: FunctionChartSettings;
  height: number;
};

type point = { x: number; value: result<number, string> };

let getFunctionImage = ({
  settings,
  fn,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
}) => {
  let chartPointsToRender = _rangeByCount(
    settings.start,
    settings.stop,
    settings.count
  );

  let chartPointsData: point[] = chartPointsToRender.map((x) => {
    let result = fn.call([x]);
    if (result.tag === "Ok") {
      if (result.value.tag === SqValueTag.Number) {
        return { x, value: { tag: "Ok", value: result.value.value } };
      } else {
        return {
          x,
          value: {
            tag: "Error",
            value: "This component expected number outputs",
          },
        };
      }
    } else {
      return {
        x,
        value: { tag: "Error", value: result.value.toString() },
      };
    }
  });

  let initialPartition: [
    { x: number; value: number }[],
    { x: number; value: string }[]
  ] = [[], []];

  let [functionImage, errors] = chartPointsData.reduce((acc, current) => {
    if (current.value.tag === "Ok") {
      acc[0].push({ x: current.x, value: current.value.value });
    } else {
      acc[1].push({ x: current.x, value: current.value.value });
    }
    return acc;
  }, initialPartition);

  return { errors, functionImage };
};

export const FunctionChart1Number: React.FC<FunctionChart1NumberProps> = ({
  fn,
  settings,
  height,
}: FunctionChart1NumberProps) => {
  let getFunctionImageMemoized = React.useMemo(
    () => getFunctionImage({ settings: settings, fn }),
    [settings, fn]
  );

  let data = getFunctionImageMemoized.functionImage.map(({ x, value }) => ({
    x,
    y: value,
  }));
  return (
    <>
      <SquiggleLineChart
        data={{ facet: data }}
        height={height}
        actions={false}
      />
      {getFunctionImageMemoized.errors.map(({ x, value }) => (
        <ErrorAlert key={x} heading={value}>
          Error at point ${x}
        </ErrorAlert>
      ))}
    </>
  );
};
