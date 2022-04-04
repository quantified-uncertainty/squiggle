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

let SquiggleVegaChart = createClassFromSpec({
  spec: chartSpecification as Spec,
});

let SquigglePercentilesChart = createClassFromSpec({
  spec: percentilesSpec as Spec,
});

export interface SquiggleChartProps {
  /** The input string for squiggle */
  squiggleString: string;

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
}

export const SquiggleChart: React.FC<SquiggleChartProps> = (props) => {
  let samplingInputs: SamplingInputs = {
    sampleCount: props.sampleCount,
    outputXYPoints: props.outputXYPoints ? props.outputXYPoints : 1000,
    kernelWidth: props.kernelWidth,
    pointDistLength: props.pointDistLength ? props.pointDistLength : 1000,
  };

  let result = run(props.squiggleString, samplingInputs, props.environment);
  if (result.tag === "Ok") {
    let environment = result.value.environment;
    let exports = result.value.exports;
    if (props.onEnvChange) props.onEnvChange(environment);
    let chartResults = exports.map((chartResult: exportDistribution) => {
      if (chartResult["NAME"] === "Float") {
        return <MakeNumberShower precision={3} number={chartResult["VAL"]} />;
      } else if (chartResult["NAME"] === "DistPlus") {
        let shape = chartResult.VAL.pointSetDist;
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
              width={props.width ? props.width : 500}
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

          let markedDisPoints: labeledPoint[] = discretePoints.map(
            ([x, y]) => ({ x: x, y: y, type: "discrete" })
          );
          let markedConPoints: labeledPoint[] = continuousPoints.map(
            ([x, y]) => ({ x: x, y: y, type: "continuous" })
          );

          let sortedPoints = _.sortBy(
            markedDisPoints.concat(markedConPoints),
            "x"
          );

          let totalContinuous = 1 - totalDiscrete;
          let totalY = continuousShape.ys.reduce(
            (a: number, b: number) => a + b
          );

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
          let discreteValues = cdfLabeledPoint.filter(
            (x) => x.type === "discrete"
          );

          return (
            <SquiggleVegaChart
              data={{ con: continuousValues, dis: discreteValues }}
              actions={false}
            />
          );
        }
      } else if (chartResult.NAME === "Function") {
        // We are looking at a function. In this case, we draw a Percentiles chart
        let start = props.diagramStart ? props.diagramStart : 0;
        let stop = props.diagramStop ? props.diagramStop : 10;
        let count = props.diagramCount ? props.diagramCount : 20;
        let step = (stop - start) / count;
        let data = _.range(start, stop, step).map((x) => {
          if (chartResult.NAME === "Function") {
            let result = chartResult.VAL(x);
            if (result.tag === "Ok") {
              let percentileArray = [
                0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95,
                0.99,
              ];

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
            }
            return null;
          }
        });
        return (
          <SquigglePercentilesChart
            data={{ facet: data.filter((x) => x !== null) }}
            actions={false}
          />
        );
      }
    });
    return <>{chartResults}</>;
  } else if (result.tag === "Error") {
    // At this point, we came across an error. What was our error?
    return <p>{"Error parsing Squiggle: " + result.value}</p>;
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

function MakeNumberShower(props: { number: number; precision: number }) {
  let numberWithPresentation = numberShow(props.number, props.precision);
  return (
    <span>
      {numberWithPresentation.value}
      {numberWithPresentation.symbol}
      {numberWithPresentation.power ? (
        <span>
          {"\u00b710"}
          <span style={{ fontSize: "0.6em", verticalAlign: "super" }}>
            {numberWithPresentation.power}
          </span>
        </span>
      ) : (
        <></>
      )}
    </span>
  );
}

const orderOfMagnitudeNum = (n: number) => {
  return Math.pow(10, n);
};

// 105 -> 3
const orderOfMagnitude = (n: number) => {
  return Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
};

function withXSigFigs(number: number, sigFigs: number) {
  const withPrecision = number.toPrecision(sigFigs);
  const formatted = Number(withPrecision);
  return `${formatted}`;
}

class NumberShower {
  number: number;
  precision: number;

  constructor(number: number, precision = 2) {
    this.number = number;
    this.precision = precision;
  }

  convert() {
    const number = Math.abs(this.number);
    const response = this.evaluate(number);
    if (this.number < 0) {
      response.value = "-" + response.value;
    }
    return response;
  }

  metricSystem(number: number, order: number) {
    const newNumber = number / orderOfMagnitudeNum(order);
    const precision = this.precision;
    return `${withXSigFigs(newNumber, precision)}`;
  }

  evaluate(number: number) {
    if (number === 0) {
      return { value: this.metricSystem(0, 0) };
    }

    const order = orderOfMagnitude(number);
    if (order < -2) {
      return { value: this.metricSystem(number, order), power: order };
    } else if (order < 4) {
      return { value: this.metricSystem(number, 0) };
    } else if (order < 6) {
      return { value: this.metricSystem(number, 3), symbol: "K" };
    } else if (order < 9) {
      return { value: this.metricSystem(number, 6), symbol: "M" };
    } else if (order < 12) {
      return { value: this.metricSystem(number, 9), symbol: "B" };
    } else if (order < 15) {
      return { value: this.metricSystem(number, 12), symbol: "T" };
    } else {
      return { value: this.metricSystem(number, order), power: order };
    }
  }
}

export function numberShow(number: number, precision = 2) {
  const ns = new NumberShower(number, precision);
  return ns.convert();
}
