import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import type { DistPlus } from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as percentilesSpec from "../vega-specs/spec-percentiles.json";
import { DistPlusChart } from "./DistPlusChart";
import { Error } from "./Error";

let SquigglePercentilesChart = createClassFromSpec({
  spec: percentilesSpec as Spec,
});

type distPlusFn = (
  a: number
) => { tag: "Ok"; value: DistPlus } | { tag: "Error"; value: string };

const _rangeByCount = (start, stop, count) => {
  const step = (stop - start) / (count - 1);
  const items = _.range(start, stop, step);
  const result = items.concat([stop]);
  return result;
};

export const FunctionChart: React.FC<{
  distPlusFn: distPlusFn;
  diagramStart: number;
  diagramStop: number;
  diagramCount: number;
}> = ({ distPlusFn, diagramStart, diagramStop, diagramCount }) => {
  let [mouseOverlay, setMouseOverlay] = React.useState(NaN);
  function handleHover(...args) {
    setMouseOverlay(args[1]);
  }
  function handleOut(...args) {
    setMouseOverlay(NaN);
  }
  const signalListeners = { mousemove: handleHover, mouseout: handleOut };
  let percentileArray = [
    0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99,
  ];
  let mouseItem = distPlusFn(mouseOverlay);
  let showChart =
    mouseItem.tag === "Ok" ? (
      <DistPlusChart distPlus={mouseItem.value} width={400} height={140} />
    ) : (
      <></>
    );
  let data1 = _rangeByCount(diagramStart, diagramStop, diagramCount);
  let valueData = data1
    .map((x) => {
      let result = distPlusFn(x);
      if (result.tag === "Ok") {
        return { x: x, value: result.value };
      } else return null;
    })
    .filter((x) => x !== null)
    .map(({ x, value }) => {
      let percentiles = getPercentiles(percentileArray, value);
      return {
        x: x,
        p1: percentiles[0],
        p5: percentiles[1],
        p10: percentiles[2],
        p20: percentiles[3],
        p30: percentiles[4],
        p40: percentiles[5],
        p50: percentiles[6],
        p60: percentiles[7],
        p70: percentiles[8],
        p80: percentiles[9],
        p90: percentiles[10],
        p95: percentiles[11],
        p99: percentiles[12],
      };
    });

  let errorData = data1
    .map((x) => {
      let result = distPlusFn(x);
      if (result.tag === "Error") {
        return { x: x, error: result.value };
      } else return null;
    })
    .filter((x) => x !== null);
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
        <Error heading={k}>
          {`Values: [${error2[k].map((r) => r.x.toFixed(2)).join(",")}]`}
        </Error>
      ))}
    </>
  );
};

function getPercentiles(percentiles: number[], t: DistPlus) {
  if (t.pointSetDist.tag === "Discrete") {
    let total = 0;
    let maxX = _.max(t.pointSetDist.value.xyShape.xs);
    let bounds = percentiles.map((_) => maxX);
    _.zipWith(
      t.pointSetDist.value.xyShape.xs,
      t.pointSetDist.value.xyShape.ys,
      (x, y) => {
        total += y;
        percentiles.forEach((v, i) => {
          if (total > v && bounds[i] === maxX) {
            bounds[i] = x;
          }
        });
      }
    );
    return bounds;
  } else if (t.pointSetDist.tag === "Continuous") {
    let total = 0;
    let maxX = _.max(t.pointSetDist.value.xyShape.xs);
    let totalY = _.sum(t.pointSetDist.value.xyShape.ys);
    let bounds = percentiles.map((_) => maxX);
    _.zipWith(
      t.pointSetDist.value.xyShape.xs,
      t.pointSetDist.value.xyShape.ys,
      (x, y) => {
        total += y / totalY;
        percentiles.forEach((v, i) => {
          if (total > v && bounds[i] === maxX) {
            bounds[i] = x;
          }
        });
      }
    );
    return bounds;
  } else if (t.pointSetDist.tag === "Mixed") {
    let discreteShape = t.pointSetDist.value.discrete.xyShape;
    let totalDiscrete = discreteShape.ys.reduce((a, b) => a + b);

    let discretePoints = _.zip(discreteShape.xs, discreteShape.ys);
    let continuousShape = t.pointSetDist.value.continuous.xyShape;
    let continuousPoints = _.zip(continuousShape.xs, continuousShape.ys);

    interface labeledPoint {
      x: number;
      y: number;
      type: "discrete" | "continuous";
    }

    let markedDisPoints: labeledPoint[] = discretePoints.map(([x, y]) => ({
      x: x,
      y: y,
      type: "discrete",
    }));
    let markedConPoints: labeledPoint[] = continuousPoints.map(([x, y]) => ({
      x: x,
      y: y,
      type: "continuous",
    }));

    let sortedPoints = _.sortBy(markedDisPoints.concat(markedConPoints), "x");

    let totalContinuous = 1 - totalDiscrete;
    let totalY = continuousShape.ys.reduce((a: number, b: number) => a + b);

    let total = 0;
    let maxX = _.max(sortedPoints.map((x) => x.x));
    let bounds = percentiles.map((_) => maxX);
    sortedPoints.map((point: labeledPoint) => {
      if (point.type === "discrete") {
        total += point.y;
      } else if (point.type === "continuous") {
        total += (point.y / totalY) * totalContinuous;
      }
      percentiles.forEach((v, i) => {
        if (total > v && bounds[i] === maxX) {
          bounds[i] = total;
        }
      });
      return total;
    });
    return bounds;
  }
}
