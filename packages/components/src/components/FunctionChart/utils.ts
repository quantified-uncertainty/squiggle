import * as d3 from "d3";
import range from "lodash/range";

import { SqLambda, SqValue } from "@quri/squiggle-lang";

import { FunctionChartSettings } from ".";

const axisColor = "rgba(114, 125, 147, 0.1)";
export const labelColor = "rgb(114, 125, 147)";
export const cursorLineColor = "#f87171"; // tailwind red-400
export const primaryColor = "#4c78a8"; // for lines and areas
const tickCount = 5;
const tickFormat = ".9~s";
const xLabelOffset = 6;
const yLabelOffset = 6;

function rangeByCount(start: number, stop: number, count: number) {
  const step = (stop - start) / (count - 1);
  const items = range(start, stop, step);
  const result = items.concat([stop]);
  return result;
}

type Subvalue<T> = T extends SqValue["tag"]
  ? Extract<SqValue, { tag: T }>
  : never;

export function getFunctionImage<T extends Exclude<SqValue["tag"], "Void">>({
  settings,
  fn,
  valueType,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
  valueType: T;
}) {
  const chartPointsToRender = rangeByCount(
    settings.start,
    settings.stop,
    settings.count
  );

  let functionImage: {
    x: number;
    y: Subvalue<T>["value"];
  }[] = [];
  let errors: { x: number; value: string }[] = [];

  for (const x of chartPointsToRender) {
    const result = fn.call([x]);
    if (result.ok) {
      if (result.value.tag === valueType) {
        functionImage.push({
          x,
          // This is sketchy, I'm not sure why the type check passes (it's not because of `if` guard above), might be a Typescript bug.
          // The result should be correct, though.
          y: result.value.value,
        });
      } else {
        errors.push({
          x,
          value: `This component expected outputs of type ${valueType}`,
        });
      }
    } else {
      errors.push({ x, value: result.value.toString() });
    }
  }

  return { errors, functionImage };
}

export type Padding = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

export function drawAxes({
  context,
  xDomain,
  yDomain,
  suggestedPadding,
  width,
  height,
}: {
  context: CanvasRenderingContext2D;
  xDomain: [number, number];
  yDomain: [number, number];
  suggestedPadding: Padding; // expanded according to label width
  width: number;
  height: number;
}) {
  const xScale = d3.scaleLinear().domain(xDomain);
  const yScale = d3.scaleLinear().domain(yDomain);

  const xTicks = xScale.ticks(tickCount);
  const xTickFormat = xScale.tickFormat(tickCount, tickFormat);

  const yTicks = yScale.ticks(tickCount);
  const yTickFormat = yScale.tickFormat(tickCount, tickFormat);

  const padding: Padding = { ...suggestedPadding };

  // measure tick sizes for dynamic padding
  yTicks.forEach((d) => {
    const measured = context.measureText(yTickFormat(d));
    padding.left = Math.max(
      padding.left,
      measured.actualBoundingBoxLeft +
        measured.actualBoundingBoxRight +
        yLabelOffset
    );
  });
  xTicks.forEach((d) => {
    const measured = context.measureText(xTickFormat(d));
    padding.right = Math.max(
      padding.right,
      (measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight) / 2
    );
  });

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  xScale.range([0, chartWidth]);
  yScale.range([0, chartHeight]);

  // x axis
  context.beginPath();
  context.strokeStyle = axisColor;
  context.lineWidth = 1;
  context.moveTo(padding.left, padding.top + chartHeight);
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = labelColor;

  xTicks.forEach((d) => {
    context.beginPath();
    context.fillText(
      xTickFormat(d),
      padding.left + xScale(d),
      padding.top + chartHeight + xLabelOffset
    );
  });

  // y axis
  context.beginPath();
  context.strokeStyle = axisColor;
  context.lineWidth = 1;
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.stroke();

  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillStyle = labelColor;

  yTicks.forEach((d) => {
    context.beginPath();
    context.fillText(
      yTickFormat(d),
      padding.left - 6,
      padding.top + chartHeight - yScale(d)
    );
  });

  return { xScale, yScale, xTickFormat, padding, chartWidth, chartHeight };
}
