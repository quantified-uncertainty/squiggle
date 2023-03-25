import { Env, result, SqError, SqLambda, SqValue } from "@quri/squiggle-lang";
import _ from "lodash";
import * as React from "react";
import { FC, useState } from "react";
import { createClassFromSpec } from "react-vega";
import type { Spec } from "vega";
import * as percentilesSpec from "../../vega-specs/spec-percentiles.json";
import { ErrorAlert } from "../Alert";
import {
  DistributionChart,
  DistributionChartSettings,
} from "../DistributionChart";
import { NumberShower } from "../NumberShower";
import { FunctionChartSettings } from "./index";
import { getFunctionImage } from "./utils";

const SquigglePercentilesChart = createClassFromSpec({
  spec: percentilesSpec as Spec,
});

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

type Percentiles = {
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

type Errors = _.Dictionary<
  {
    x: number;
    value: string;
  }[]
>;

const getPercentiles = ({
  settings,
  fn,
  environment,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
  environment: Env;
}) => {
  const { functionImage, errors } = getFunctionImage({
    settings,
    fn,
    valueType: "Dist",
  });

  const groupedErrors: Errors = _.groupBy(errors, (x) => x.value);

  const percentiles: Percentiles = functionImage.map(({ x, y: dist }) => {
    const res = {
      x: x,
      p1: unwrap(dist.inv(environment, 0.01)),
      p5: unwrap(dist.inv(environment, 0.05)),
      p10: unwrap(dist.inv(environment, 0.1)),
      p20: unwrap(dist.inv(environment, 0.2)),
      p30: unwrap(dist.inv(environment, 0.3)),
      p40: unwrap(dist.inv(environment, 0.4)),
      p50: unwrap(dist.inv(environment, 0.5)),
      p60: unwrap(dist.inv(environment, 0.6)),
      p70: unwrap(dist.inv(environment, 0.7)),
      p80: unwrap(dist.inv(environment, 0.8)),
      p90: unwrap(dist.inv(environment, 0.9)),
      p95: unwrap(dist.inv(environment, 0.95)),
      p99: unwrap(dist.inv(environment, 0.99)),
    };
    return res;
  });

  return { percentiles, errors: groupedErrors };
};

export const FunctionChart1Dist: FC<FunctionChart1DistProps> = ({
  fn,
  settings,
  environment,
  distributionChartSettings,
  height,
}) => {
  const [mouseOverlay, setMouseOverlay] = useState(0);
  const handleHover = (_name: string, value: unknown) => {
    setMouseOverlay(value as number);
  };
  const handleOut = () => {
    setMouseOverlay(NaN);
  };
  const signalListeners = { mousemove: handleHover, mouseout: handleOut };

  //TODO: This custom error handling is a bit hacky and should be improved.
  const mouseItem: result<SqValue, SqError> = !!mouseOverlay
    ? fn.call([mouseOverlay])
    : {
        ok: false,
        value: SqError.createOtherError(
          "Hover x-coordinate returned NaN. Expected a number."
        ),
      };
  const showChart =
    mouseItem.ok && mouseItem.value.tag === "Dist" ? (
      <DistributionChart
        distribution={mouseItem.value.value}
        environment={environment}
        chartHeight={50}
        settings={distributionChartSettings}
      />
    ) : null;

  const getPercentilesMemoized = React.useMemo(
    () => getPercentiles({ settings, fn, environment }),
    [environment, fn, settings]
  );

  return (
    <div>
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
    </div>
  );
};
