import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import {
  SqDistribution,
  result,
  SqLambda,
  environment,
  SqError,
  SqValue,
  SqValueTag,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as percentilesSpec from "../vega-specs/spec-percentiles.json";
import {
  DistributionChart,
  DistributionPlottingSettings,
  defaultPlot,
} from "./DistributionChart";
import { NumberShower } from "./NumberShower";
import { ErrorAlert } from "./Alert";

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

interface FunctionChart1DistProps {
  fn: SqLambda;
  chartSettings: FunctionChartSettings;
  distributionPlotSettings: DistributionPlottingSettings;
  environment: environment;
  height: number;
}

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
  chartSettings,
  fn,
  environment,
}: {
  chartSettings: FunctionChartSettings;
  fn: SqLambda;
  environment: environment;
}) => {
  let chartPointsToRender = _rangeByCount(
    chartSettings.start,
    chartSettings.stop,
    chartSettings.count
  );

  let chartPointsData: point[] = chartPointsToRender.map((x) => {
    let result = fn.call([x]);
    if (result.tag === "Ok") {
      if (result.value.tag === SqValueTag.Distribution) {
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
        value: { tag: "Error", value: result.value.toString() },
      };
    }
  });

  let initialPartition: [
    { x: number; value: SqDistribution }[],
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

  let groupedErrors: errors = _.groupBy(errors, (x) => x.value);

  let percentiles: percentiles = functionImage.map(({ x, value }) => {
    // We convert it to to a pointSet distribution first, so that in case its a sample set
    // distribution, it doesn't internally convert it to a pointSet distribution for every
    // single inv() call.
    let toPointSet = unwrap(value.pointSet(environment)).asDistribution();
    return {
      x: x,
      p1: unwrap(toPointSet.inv(environment, 0.01)),
      p5: unwrap(toPointSet.inv(environment, 0.05)),
      p10: unwrap(toPointSet.inv(environment, 0.1)),
      p20: unwrap(toPointSet.inv(environment, 0.2)),
      p30: unwrap(toPointSet.inv(environment, 0.3)),
      p40: unwrap(toPointSet.inv(environment, 0.4)),
      p50: unwrap(toPointSet.inv(environment, 0.5)),
      p60: unwrap(toPointSet.inv(environment, 0.6)),
      p70: unwrap(toPointSet.inv(environment, 0.7)),
      p80: unwrap(toPointSet.inv(environment, 0.8)),
      p90: unwrap(toPointSet.inv(environment, 0.9)),
      p95: unwrap(toPointSet.inv(environment, 0.95)),
      p99: unwrap(toPointSet.inv(environment, 0.99)),
    };
  });

  return { percentiles, errors: groupedErrors };
};

export const FunctionChart1Dist: React.FC<FunctionChart1DistProps> = ({
  fn,
  chartSettings,
  environment,
  distributionPlotSettings,
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
        tag: "Error",
        value: SqError.createOtherError(
          "Hover x-coordinate returned NaN. Expected a number."
        ),
      };
  let showChart =
    mouseItem.tag === "Ok" &&
    mouseItem.value.tag === SqValueTag.Distribution ? (
      <DistributionChart
        plot={defaultPlot(mouseItem.value.value)}
        environment={environment}
        width={400}
        height={50}
        {...distributionPlotSettings}
      />
    ) : null;

  let getPercentilesMemoized = React.useMemo(
    () => getPercentiles({ chartSettings, fn, environment }),
    [environment, fn]
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
