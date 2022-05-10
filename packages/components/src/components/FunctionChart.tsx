import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import {
  Distribution,
  result,
  lambdaValue,
  environment,
  runForeign,
  errorValueToString,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as percentilesSpec from "../vega-specs/spec-percentiles.json";
import { DistributionChart } from "./DistributionChart";
import { NumberShower } from "./NumberShower";
import { ErrorBox } from "./ErrorBox";

let SquigglePercentilesChart = createClassFromSpec({
  spec: percentilesSpec as Spec,
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
}

export const FunctionChart: React.FC<FunctionChartProps> = ({
  fn,
  chartSettings,
  environment,
}: FunctionChartProps) => {
  let [mouseOverlay, setMouseOverlay] = React.useState(0);
  function handleHover(_name: string, value: unknown) {
    setMouseOverlay(value as number);
  }
  function handleOut() {
    setMouseOverlay(NaN);
  }
  const signalListeners = { mousemove: handleHover, mouseout: handleOut };
  let mouseItem = runForeign(fn, [mouseOverlay], environment);
  let showChart =
    mouseItem.tag === "Ok" && mouseItem.value.tag == "distribution" ? (
      <DistributionChart
        distribution={mouseItem.value.value}
        width={400}
        height={140}
      />
    ) : (
      <></>
    );
  let data1 = _rangeByCount(
    chartSettings.start,
    chartSettings.stop,
    chartSettings.count
  );
  type point = { x: number; value: result<Distribution, string> };
  let valueData: point[] = data1.map((x) => {
    let result = runForeign(fn, [x], environment);
    if (result.tag === "Ok") {
      if (result.value.tag == "distribution") {
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
    { x: number; value: Distribution }[],
    { x: number; value: string }[]
  ] = [[], []];
  let [functionImage, errors] = valueData.reduce((acc, current) => {
    if (current.value.tag === "Ok") {
      acc[0].push({ x: current.x, value: current.value.value });
    } else {
      acc[1].push({ x: current.x, value: current.value.value });
    }
    return acc;
  }, initialPartition);

  let percentiles = functionImage.map(({ x, value }) => {
    return {
      x: x,
      p1: unwrap(value.inv(0.01)),
      p5: unwrap(value.inv(0.05)),
      p10: unwrap(value.inv(0.12)),
      p20: unwrap(value.inv(0.2)),
      p30: unwrap(value.inv(0.3)),
      p40: unwrap(value.inv(0.4)),
      p50: unwrap(value.inv(0.5)),
      p60: unwrap(value.inv(0.6)),
      p70: unwrap(value.inv(0.7)),
      p80: unwrap(value.inv(0.8)),
      p90: unwrap(value.inv(0.9)),
      p95: unwrap(value.inv(0.95)),
      p99: unwrap(value.inv(0.99)),
    };
  });

  let groupedErrors = _.groupBy(errors, (x) => x.value);
  return (
    <>
      <SquigglePercentilesChart
        data={{ facet: percentiles }}
        actions={false}
        signalListeners={signalListeners}
      />
      {showChart}
      {_.entries(groupedErrors).map(([errorName, errorPoints]) => (
        <ErrorBox heading={errorName}>
          Values:{" "}
          {errorPoints
            .map((r) => <NumberShower number={r.x} />)
            .reduce((a, b) => (
              <>
                {a}, {b}
              </>
            ))}
        </ErrorBox>
      ))}
    </>
  );
};
