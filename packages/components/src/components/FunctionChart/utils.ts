import {
  SqNumericFnPlot,
  SqDistFnPlot,
  SqDistribution,
  SqNumberValue,
  Env,
  SqScale,
} from "@quri/squiggle-lang";
import { sqScaleToD3 } from "../../lib/d3/index.js";
import { ScaleContinuousNumeric } from "d3";

export const functionChartDefaults = {
  min: 0,
  max: 10,
  points: 20,
};

function rangeByCount({
  scale,
  count,
}: {
  scale: ScaleContinuousNumeric<number, number, never>;
  count: number;
}) {
  scale.range([0, count - 1]);
  const items: number[] = [];
  for (let i = 0; i < count; i++) {
    items.push(scale.invert(i));
  }
  scale.range([0, 1]); // reset to default range
  return items;
}

type ImageValue<T extends SqNumericFnPlot | SqDistFnPlot> =
  T["tag"] extends "numericFn" ? number : SqDistribution;

export type ImageError = {
  x: number;
  value: string;
};

export function getFunctionImage<T extends SqNumericFnPlot | SqDistFnPlot>(
  plot: T,
  environment: Env
) {
  const scale = sqScaleToD3(plot.xScale);
  scale.domain([
    plot.xScale?.min ?? functionChartDefaults.min,
    plot.xScale?.max ?? functionChartDefaults.max,
  ]);

  const chartPointsToRender = rangeByCount({
    scale,
    count: plot.points ?? functionChartDefaults.points,
  });

  const functionImage: {
    x: number;
    y: ImageValue<T>;
  }[] = [];
  const errors: ImageError[] = [];

  for (const x of chartPointsToRender) {
    const result = plot.fn.call([SqNumberValue.create(x)], environment);
    if (result.ok) {
      if (result.value.tag === "Number" && plot.tag === "numericFn") {
        functionImage.push({
          x,
          /* TypeScript is hard to satisfy here, because it's not possible to narrow generic type parameters.
           * See also:
           * https://stackoverflow.com/questions/72890232/how-do-i-link-join-relate-the-types-of-two-function-parameters-in-typescript
           * https://github.com/microsoft/TypeScript/issues/27808
           */
          y: result.value.value as ImageValue<T>,
        });
      } else if (result.value.tag === "Dist" && plot.tag === "distFn") {
        functionImage.push({
          x,
          y: result.value.value as ImageValue<T>,
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

  return { errors, functionImage, xScale: scale };
}
