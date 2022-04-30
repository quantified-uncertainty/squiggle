import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import type { Distribution, errorValue, result } from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as percentilesSpec from "../vega-specs/spec-percentiles.json";
import { DistributionChart } from "./DistributionChart";
import { ErrorBox } from "./ErrorBox";

let SquigglePercentilesChart = createClassFromSpec({
  spec: percentilesSpec as Spec,
});

type distPlusFn = (a: number) => result<Distribution, errorValue>;

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

function mapFilter<a, b>(xs: a[], f: (x: a) => b | undefined): b[] {
  let initial: b[] = [];
  return xs.reduce((previous, current) => {
    let value: b | undefined = f(current);
    if (value !== undefined) {
      return previous.concat([value]);
    } else {
      return previous;
    }
  }, initial);
}

export const FunctionChart: React.FC<{
  distPlusFn: distPlusFn;
  diagramStart: number;
  diagramStop: number;
  diagramCount: number;
}> = ({ distPlusFn, diagramStart, diagramStop, diagramCount }) => {
  let [mouseOverlay, setMouseOverlay] = React.useState(0);
  function handleHover(...args) {
    setMouseOverlay(args[1]);
  }
  function handleOut() {
    setMouseOverlay(NaN);
  }
  const signalListeners = { mousemove: handleHover, mouseout: handleOut };
  let mouseItem = distPlusFn(mouseOverlay);
  let showChart =
    mouseItem.tag === "Ok" ? (
      <DistributionChart
        distribution={mouseItem.value}
        width={400}
        height={140}
        showSummary={false}
      />
    ) : (
      <></>
    );
  let data1 = _rangeByCount(diagramStart, diagramStop, diagramCount);
  let valueData = mapFilter(data1, (x) => {
    let result = distPlusFn(x);
    if (result.tag === "Ok") {
      return { x: x, value: result.value };
    }
  }).map(({ x, value }) => {
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

  let errorData = mapFilter(data1, (x) => {
    let result = distPlusFn(x);
    if (result.tag === "Error") {
      return { x: x, error: result.value };
    }
  });
  let error2 = _.groupBy(errorData, (x) => x.error);
  return (
    <>
      <SquigglePercentilesChart
        data={{ facet: valueData }}
        actions={false}
        signalListeners={signalListeners}
      />
      {showChart}
      {_.keysIn(error2).map((k) => (
        <ErrorBox heading={k}>
          {`Values: [${error2[k].map((r) => r.x.toFixed(2)).join(",")}]`}
        </ErrorBox>
      ))}
    </>
  );
};
