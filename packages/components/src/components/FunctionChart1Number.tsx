import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import {
  Distribution,
  result,
  lambdaValue,
  environment,
  runForeign,
  squiggleExpression,
  errorValue,
  errorValueToString,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as lineChartSpec from "../vega-specs/spec-line-chart.json";
import { DistributionChart } from "./DistributionChart";
import { NumberShower } from "./NumberShower";
import { ErrorBox } from "./ErrorBox";

let SquiggleLineChart = createClassFromSpec({
  spec: lineChartSpec as Spec,
});

const _rangeByCount = (start: number, stop: number, count: number) => {
  const step = (stop - start) / (count - 1);
  const items = _.range(start, stop, step);
  const result = items.concat([stop]);
  return result;
};

function unwrap<a, b>(x: result<a, b>): a {
  if (x.tag === "Ok") {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}
export type FunctionChartSettings = {
  start: number;
  stop: number;
  count: number;
};

interface FunctionChartProps {
  fn: lambdaValue;
  chartSettings: FunctionChartSettings;
  environment: environment;
  height: number;
}

type point = { x: number; value: result<number, string> };

let getFunctionImage = ({ chartSettings, fn, environment }) => {
  //We adjust the count, because the count is made for distributions, which are much more expensive to estimate
  let adjustedCount = chartSettings.count * 20;

  let chartPointsToRender = _rangeByCount(
    chartSettings.start,
    chartSettings.stop,
    adjustedCount
  );

  let chartPointsData: point[] = chartPointsToRender.map((x) => {
    let result = runForeign(fn, [x], environment);
    if (result.tag === "Ok") {
      if (result.value.tag == "number") {
        return { x, value: { tag: "Ok", value: result.value.value } };
      } else {
        return {
          x,
          value: {
            tag: "Error",
            value:
              "Cannot currently render functions that don't return distributions",
          },
        };
      }
    } else {
      return {
        x,
        value: { tag: "Error", value: errorValueToString(result.value) },
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

export const FunctionChart1Number: React.FC<FunctionChartProps> = ({
  fn,
  chartSettings,
  environment,
  height,
}: FunctionChartProps) => {
  let [mouseOverlay, setMouseOverlay] = React.useState(0);
  function handleHover(_name: string, value: unknown) {
    setMouseOverlay(value as number);
  }
  function handleOut() {
    setMouseOverlay(NaN);
  }
  const signalListeners = { mousemove: handleHover, mouseout: handleOut };
  let mouseItem: result<squiggleExpression, errorValue> = !!mouseOverlay
    ? runForeign(fn, [mouseOverlay], environment)
    : {
        tag: "Error",
        value: {
          tag: "REExpectedType",
          value: "Hover x-coordinate returned NaN. Expected a number.",
        },
      };

  let getFunctionImageMemoized = React.useMemo(
    () => getFunctionImage({ chartSettings, fn, environment }),
    [environment, fn]
  );

  let data = getFunctionImageMemoized.functionImage.map(({x, value}) => ({x, y:value}))
  return (
    <>
      <SquiggleLineChart
        data={{ facet: data }}
        height={height}
        actions={false}
        signalListeners={signalListeners}
      />
      {getFunctionImageMemoized.errors.map(({ x, value }) => (
        <ErrorBox key={x} heading={value}>
          Error at point ${x}
        </ErrorBox>
      ))}
    </>
  );
};
