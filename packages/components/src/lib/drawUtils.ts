import * as d3 from "d3";
import range from "lodash/range.js";

import { SqLambda, SqValue } from "@quri/squiggle-lang";

import { FunctionChartSettings } from "../components/FunctionChart/index.js";

const axisColor = "rgba(114, 125, 147, 0.1)";
export const labelColor = "rgb(114, 125, 147)";
export const cursorLineColor = "#f87171"; // tailwind red-400
export const primaryColor = "#4c78a8"; // for lines and areas
const labelFont = "10px sans-serif";
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
  hideYAxis,
  drawTicks,
  logX,
  expY,
  tickCount = 5,
  tickFormat = ".9~s",
}: {
  context: CanvasRenderingContext2D;
  xDomain: [number, number];
  yDomain: [number, number];
  suggestedPadding: Padding; // expanded according to label width
  width: number;
  height: number;
  hideYAxis?: boolean;
  drawTicks?: boolean;
  logX?: boolean;
  expY?: boolean;
  tickCount?: number;
  tickFormat?: string;
}) {
  const xScale = logX ? d3.scaleLog() : d3.scaleLinear();
  xScale.domain(xDomain);
  const yScale = expY ? d3.scalePow().exponent(0.1) : d3.scaleLinear();
  yScale.domain(yDomain);

  const xTicks = xScale.ticks(tickCount);
  const xTickFormat = xScale.tickFormat(tickCount, tickFormat);

  const yTicks = yScale.ticks(tickCount);
  const yTickFormat = yScale.tickFormat(tickCount, tickFormat);

  const tickSize = 2;

  const padding: Padding = { ...suggestedPadding };

  // measure tick sizes for dynamic padding
  if (!hideYAxis) {
    yTicks.forEach((d) => {
      const measured = context.measureText(yTickFormat(d));
      padding.left = Math.max(
        padding.left,
        measured.actualBoundingBoxLeft +
          measured.actualBoundingBoxRight +
          yLabelOffset
      );
    });
  }

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  xScale.range([0, chartWidth]);
  yScale.range([0, chartHeight]);

  // x axis
  {
    context.save();
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(padding.left, padding.top + chartHeight);
    context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    context.stroke();

    context.fillStyle = labelColor;
    context.font = labelFont;

    let prevBoundary = 0;
    for (let i = 0; i < xTicks.length; i++) {
      const xTick = xTicks[i];
      const x = padding.left + xScale(xTick);
      const y = padding.top + chartHeight;

      if (drawTicks) {
        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(x, y);
        context.lineTo(x, y + tickSize);
        context.stroke();
      }
      context.textAlign = "left";
      context.textBaseline = "top";
      const text = xTickFormat(xTick);
      const { width: textWidth } = context.measureText(text);
      let startX = 0;
      if (i === 0) {
        startX = Math.max(x - textWidth / 2, 0);
      } else if (i === xTicks.length - 1) {
        startX = Math.min(x - textWidth / 2, width - textWidth);
      } else {
        startX = x - textWidth / 2;
      }
      if (startX < prevBoundary) {
        continue; // doesn't fit, skip
      }
      context.fillText(text, startX, y + xLabelOffset);
      prevBoundary = startX + textWidth;
    }
  }
  context.restore();

  // y axis
  if (!hideYAxis) {
    context.save();
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, padding.top + chartHeight);
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = labelColor;
    context.font = labelFont;

    yTicks.forEach((d) => {
      context.beginPath();
      context.fillText(
        yTickFormat(d),
        padding.left - 6,
        padding.top + chartHeight - yScale(d)
      );
    });
    context.restore();
  }

  return { xScale, yScale, xTickFormat, padding, chartWidth, chartHeight };
}

export function drawVerticalCursorLine({
  cursor,
  padding,
  chartWidth,
  chartHeight,
  xScale,
  tickFormat,
  context,
}: {
  cursor: [number, number]; // original canvas coordinates
  padding: Padding;
  chartWidth: number;
  chartHeight: number;
  xScale: d3.ScaleContinuousNumeric<number, number, never>;
  tickFormat: (d: d3.NumberValue) => string;
  context: CanvasRenderingContext2D;
}) {
  context.save();

  context.beginPath();
  context.strokeStyle = cursorLineColor;
  context.lineWidth = 1;
  context.moveTo(cursor[0], padding.top);
  context.lineTo(cursor[0], padding.top + chartHeight);
  context.stroke();

  context.textAlign = "left";
  context.textBaseline = "bottom";
  const text = tickFormat(xScale.invert(cursor[0] - padding.left));
  const measured = context.measureText(text);

  // TODO - could be simplified with cotext.translate
  const px = 4,
    py = 2,
    mx = 4,
    my = 4;

  let boxWidth = measured.width + px * 2;
  const boxHeight = measured.actualBoundingBoxAscent + py * 2;
  const boxOrigin = {
    x: cursor[0] + mx,
    y: chartHeight + padding.top - boxHeight - my,
  };
  const flip =
    boxOrigin.x + boxWidth > chartWidth + padding.left + padding.right &&
    // in pathological cases, we can't fix the box on either side because the text is too long; in this case, we don't flip because first digits are more significant
    boxWidth <= cursor[0];

  if (flip) {
    boxOrigin.x = cursor[0] - mx;
    boxWidth = -boxWidth;
    context.textAlign = "right";
  }

  context.globalAlpha = 0.7;
  context.fillStyle = "white";
  context.fillRect(boxOrigin.x, boxOrigin.y, boxWidth, boxHeight);
  context.globalAlpha = 1;
  context.fillStyle = labelColor;
  context.fillText(
    text,
    boxOrigin.x + px * (flip ? -1 : 1),
    chartHeight + padding.top - my - py + 1 // unsure why "+1" is needed, probably related to measureText result and could be fixed
  );

  context.restore();
}

export function drawCircle({
  context,
  x,
  y,
  r,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  r: number;
}) {
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2, true);
  context.fill();
}
