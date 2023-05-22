import range from "lodash/range.js";

import {
  SqNumericFnPlot,
  SqDistFnPlot,
  SqDistribution,
  SqNumberValue,
  Env,
} from "@quri/squiggle-lang";

export const functionChartDefaults = {
  min: 0,
  max: 10,
  points: 20,
};

function rangeByCount(start: number, stop: number, count: number) {
  const step = (stop - start) / (count - 1);
  const items = range(start, stop, step);
  const result = items.concat([stop]);
  return result;
}

type ImageValue<T extends SqNumericFnPlot | SqDistFnPlot> =
  T["tag"] extends "numericFn" ? number : SqDistribution;

export function getFunctionImage<T extends SqNumericFnPlot | SqDistFnPlot>(
  plot: T,
  environment: Env
) {
  const chartPointsToRender = rangeByCount(
    plot.xScale?.min ?? functionChartDefaults.min,
    plot.xScale?.max ?? functionChartDefaults.max,
    plot.points ?? functionChartDefaults.points
  );

  let functionImage: {
    x: number;
    y: ImageValue<T>;
  }[] = [];
  let errors: { x: number; value: string }[] = [];

  for (const x of chartPointsToRender) {
    const result = plot.fn.directCall([SqNumberValue.create(x)], environment);
    if (result.ok) {
      if (result.value.tag === "Number" && plot.tag === "numericFn") {
        functionImage.push({
          x,
          y: result.value.value as any, // typescript is hard to satisfy here
        });
      } else if (result.value.tag === "Dist" && plot.tag === "distFn") {
        functionImage.push({
          x,
          y: result.value.value as any,
        });
      } else {
        errors.push({
          x,
          value: `This component expected outputs of type ${
            plot.tag === "numericFn" ? "Number" : "Dist"
          }, got: ${result.value.toString()}`,
        });
      }
    } else {
      errors.push({ x, value: result.value.toString() });
    }
  }

  return { errors, functionImage };
}
