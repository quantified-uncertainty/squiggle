import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import type {
  DistPlus,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as chartSpecification from "../vega-specs/spec-distributions.json";

let SquiggleVegaChart = createClassFromSpec({
  spec: chartSpecification as Spec,
});

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