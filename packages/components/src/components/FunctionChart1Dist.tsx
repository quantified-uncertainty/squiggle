import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import {
  SqDistribution,
  result,
  SqLambda,
  Env,
  SqError,
  SqValue,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as percentilesSpec from "../vega-specs/spec-percentiles.json";
import {
  DistributionChart,
  DistributionChartSettings,
} from "./DistributionChart";
import { NumberShower } from "./NumberShower";
import { ErrorAlert } from "./Alert";
import { FunctionChartSettings } from "./FunctionChart";

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
  if (x.ok) {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}
type FunctionChart1DistProps = {
  fn: SqLambda;
  settings: FunctionChartSettings;
  distributionChartSettings: DistributionChartSettings;
  environment: Env;
  height: number;
};

type percentiles = {
  x: number;
  p1: number;
  p5: number;
  p10: number;
  p20: number;
  p30: number;
  p40: number;
  p50: number;
  p60: number;
  p70: number;
  p80: number;
  p90: number;
  p95: number;
  p99: number;
}[];

type errors = _.Dictionary<
  {
    x: number;
    value: string;
  }[]
>;

type point = { x: number; value: result<SqDistribution, string> };

let getPercentiles = ({
  settings,
  fn,
  environment,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
  environment: Env;
}) => {
  let chartPointsToRender = _rangeByCount(
    settings.start,
    settings.stop,
    settings.count
  );

  const chartPointsData: point[] = chartPointsToRender.map((x) => {
    let result = fn.call([x]);
    if (result.ok) {
      if (result.value.tag === "Dist") {
        return { x, value: { ok: true, value: result.value.value } };
      } else {
        return {
          x,
          value: {
            ok: false,
            value:
              "Cannot currently render functions that don't return distributions",
          },
        };
      }
    } else {
      return {
        x,
        value: { ok: false, value: result.value.toString() },
      };
    }
  });

  let initialPartition: [
    { x: number; value: SqDistribution }[],
    { x: number; value: string }[]
  ] = [[], []];

  let [functionImage, errors] = chartPointsData.reduce((acc, current) => {
    if (current.value.ok) {
      acc[0].push({ x: current.x, value: current.value.value });
    } else {
      acc[1].push({ x: current.x, value: current.value.value });
    }
    return acc;
  }, initialPartition);

  let groupedErrors: errors = _.groupBy(errors, (x) => x.value);

  let percentiles: percentiles = functionImage.map(({ x, value }) => {
    const res = {
      x: x,
      p1: unwrap(value.inv(environment, 0.01)),
      p5: unwrap(value.inv(environment, 0.05)),
      p10: unwrap(value.inv(environment, 0.1)),
      p20: unwrap(value.inv(environment, 0.2)),
      p30: unwrap(value.inv(environment, 0.3)),
      p40: unwrap(value.inv(environment, 0.4)),
      p50: unwrap(value.inv(environment, 0.5)),
      p60: unwrap(value.inv(environment, 0.6)),
      p70: unwrap(value.inv(environment, 0.7)),
      p80: unwrap(value.inv(environment, 0.8)),
      p90: unwrap(value.inv(environment, 0.9)),
      p95: unwrap(value.inv(environment, 0.95)),
      p99: unwrap(value.inv(environment, 0.99)),
    };
    return res;
  });

  return { percentiles, errors: groupedErrors };
};

export const FunctionChart1Dist: React.FC<FunctionChart1DistProps> = ({
  fn,
  settings,
  environment,
  distributionChartSettings,
  height,
}) => {
  let [mouseOverlay, setMouseOverlay] = React.useState(0);
  function handleHover(_name: string, value: unknown) {
    setMouseOverlay(value as number);
  }
  function handleOut() {
    setMouseOverlay(NaN);
  }
  const signalListeners = { mousemove: handleHover, mouseout: handleOut };

  //TODO: This custom error handling is a bit hacky and should be improved.
  let mouseItem: result<SqValue, SqError> = !!mouseOverlay
    ? fn.call([mouseOverlay])
    : {
        ok: false,
        value: SqError.createOtherError(
          "Hover x-coordinate returned NaN. Expected a number."
        ),
      };
  let showChart =
    mouseItem.ok && mouseItem.value.tag === "Dist" ? (
      <DistributionChart
        distribution={mouseItem.value.value}
        environment={environment}
        chartHeight={50}
        settings={distributionChartSettings}
      />
    ) : null;

  let getPercentilesMemoized = React.useMemo(
    () => getPercentiles({ settings, fn, environment }),
    [environment, fn, settings]
  );

  return (
    <>
      <SquigglePercentilesChart
        data={{ facet: getPercentilesMemoized.percentiles }}
        height={height}
        actions={false}
        signalListeners={signalListeners}
      />
      {showChart}
      {_.entries(getPercentilesMemoized.errors).map(
        ([errorName, errorPoints]) => (
          <ErrorAlert key={errorName} heading={errorName}>
            Values:{" "}
            {errorPoints
              .map((r, i) => <NumberShower key={i} number={r.x} />)
              .reduce((a, b) => (
                <>
                  {a}, {b}
                </>
              ))}
          </ErrorAlert>
        )
      )}
    </>
  );
};
