import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import { run } from "@quri/squiggle-lang";
import type {
  DistPlus,
  SamplingInputs,
  exportEnv,
  exportDistribution,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as chartSpecification from "./spec-distributions.json";
import * as percentilesSpec from "./spec-percentiles.json";
import { NumberShower } from "./NumberShower";
import styled from "styled-components";
import { CONTINUOUS_TO_DISCRETE_SCALES } from "vega-lite/build/src/scale";

let SquiggleVegaChart = createClassFromSpec({
  spec: chartSpecification as Spec,
});

let SquigglePercentilesChart = createClassFromSpec({
  spec: percentilesSpec as Spec,
});

export interface SquiggleChartProps {
  /** The input string for squiggle */
  squiggleString?: string;

  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** The amount of points returned to draw the distribution */
  outputXYPoints?: number;
  kernelWidth?: number;
  pointDistLength?: number;
  /** If the result is a function, where the function starts */
  diagramStart?: number;
  /** If the result is a function, where the function ends */
  diagramStop?: number;
  /** If the result is a function, how many points along the function it samples */
  diagramCount?: number;
  /** variables declared before this expression */
  environment?: exportEnv;
  /** When the environment changes */
  onEnvChange?(env: exportEnv): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
}

const Error = styled.div`
  border: 1px solid #792e2e;
  background: #eee2e2;
  padding: 0.4em 0.8em;
`;

const ShowError: React.FC<{ heading: string; children: React.ReactNode }> = ({
  heading = "Error",
  children,
}) => {
  return (
    <Error>
      <h3>{heading}</h3>
      {children}
    </Error>
  );
};

export const DistPlusChart: React.FC<{
  distPlus: DistPlus;
  width: number;
  height: number;
}> = ({ distPlus, width, height }) => {
  let shape = distPlus.pointSetDist;
  if (shape.tag === "Continuous") {
    let xyShape = shape.value.xyShape;
    let totalY = xyShape.ys.reduce((a, b) => a + b);
    let total = 0;
    let cdf = xyShape.ys.map((y) => {
      total += y;
      return total / totalY;
    });
    let values = _.zip(cdf, xyShape.xs, xyShape.ys).map(([c, x, y]) => ({
      cdf: (c * 100).toFixed(2) + "%",
      x: x,
      y: y,
    }));

    return (
      <SquiggleVegaChart
        width={width}
        height={height}
        data={{ con: values }}
        actions={false}
      />
    );
  } else if (shape.tag === "Discrete") {
    let xyShape = shape.value.xyShape;
    let totalY = xyShape.ys.reduce((a, b) => a + b);
    let total = 0;
    let cdf = xyShape.ys.map((y) => {
      total += y;
      return total / totalY;
    });
    let values = _.zip(cdf, xyShape.xs, xyShape.ys).map(([c, x, y]) => ({
      cdf: (c * 100).toFixed(2) + "%",
      x: x,
      y: y,
    }));

    return <SquiggleVegaChart data={{ dis: values }} actions={false} />;
  } else if (shape.tag === "Mixed") {
    let discreteShape = shape.value.discrete.xyShape;
    let totalDiscrete = discreteShape.ys.reduce((a, b) => a + b);

    let discretePoints = _.zip(discreteShape.xs, discreteShape.ys);
    let continuousShape = shape.value.continuous.xyShape;
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
    let cdf = sortedPoints.map((point: labeledPoint) => {
      if (point.type === "discrete") {
        total += point.y;
        return total;
      } else if (point.type === "continuous") {
        total += (point.y / totalY) * totalContinuous;
        return total;
      }
    });

    interface cdfLabeledPoint {
      cdf: string;
      x: number;
      y: number;
      type: "discrete" | "continuous";
    }
    let cdfLabeledPoint: cdfLabeledPoint[] = _.zipWith(
      cdf,
      sortedPoints,
      (c: number, point: labeledPoint) => ({
        ...point,
        cdf: (c * 100).toFixed(2) + "%",
      })
    );
    let continuousValues = cdfLabeledPoint.filter(
      (x) => x.type === "continuous"
    );
    let discreteValues = cdfLabeledPoint.filter((x) => x.type === "discrete");

    return (
      <SquiggleVegaChart
        data={{ con: continuousValues, dis: discreteValues }}
        actions={false}
      />
    );
  }
};

const _rangeByCount = (start, stop, count) => {
  const step = (stop - start) / (count - 1);
  const items = _.range(start, stop, step);
  const result = items.concat([stop]);
  return result;
};

type distPlusFn = (
  a: number
) => { tag: "Ok"; value: DistPlus } | { tag: "Error"; value: string };

// This could really use a line in the location of the signal. I couldn't get it to work.
// https://vega.github.io/vega/docs/signals/#handlers

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
  let data = _rangeByCount(diagramStart, diagramStop, diagramCount)
    .map((x) => {
      let result = distPlusFn(x);
      if (result.tag === "Ok") {
        let percentiles = getPercentiles(percentileArray, result.value);
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
      } else {
        console.log("Error", x, result);
        return null;
      }
    })
    .filter((x) => x !== null);
  return (
    <>
      <SquigglePercentilesChart
        data={{ facet: data }}
        actions={false}
        signalListeners={signalListeners}
      />
      {showChart}
    </>
  );
};

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  sampleCount = 1000,
  outputXYPoints = 1000,
  kernelWidth,
  pointDistLength = 1000,
  diagramStart = 0,
  diagramStop = 10,
  diagramCount = 20,
  environment = [],
  onEnvChange = () => {},
  width = 500,
  height = 60,
}: SquiggleChartProps) => {
  let samplingInputs: SamplingInputs = {
    sampleCount: sampleCount,
    outputXYPoints: outputXYPoints,
    kernelWidth: kernelWidth,
    pointDistLength: pointDistLength,
  };

  let result = run(squiggleString, samplingInputs, environment);
  if (result.tag === "Ok") {
    let environment = result.value.environment;
    let exports = result.value.exports;
    onEnvChange(environment);
    let chartResults = exports.map((chartResult: exportDistribution) => {
      if (chartResult["NAME"] === "Float") {
        return <NumberShower precision={3} number={chartResult["VAL"]} />;
      } else if (chartResult["NAME"] === "DistPlus") {
        return (
          <DistPlusChart
            distPlus={chartResult.VAL}
            height={height}
            width={width}
          />
        );
      } else if (chartResult.NAME === "Function") {
        return (
          <FunctionChart
            distPlusFn={chartResult.VAL}
            diagramStart={diagramStart}
            diagramStop={diagramStop}
            diagramCount={diagramCount}
          />
        );
      }
    });
    return <>{chartResults}</>;
  } else if (result.tag === "Error") {
    // At this point, we came across an error. What was our error?
    return <ShowError heading={"Parse Error"}>{result.value}</ShowError>;
  }
  return <p>{"Invalid Response"}</p>;
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
