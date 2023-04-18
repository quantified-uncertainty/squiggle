import * as d3 from "d3";
import { CartesianFrame } from "./CartesianFrame.js";
import { Padding, Point } from "./types.js";

const axisColor = "rgba(114, 125, 147, 0.1)";
export const labelColor = "rgb(114, 125, 147)";
export const cursorLineColor = "#f87171"; // tailwind red-400
export const primaryColor = "#4c78a8"; // for lines and areas
const labelFont = "10px sans-serif";
const xLabelOffset = 6;
const yLabelOffset = 6;

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

  const frame = new CartesianFrame({
    context,
    x0: padding.left,
    y0: height - padding.bottom,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom,
  });
  xScale.range([0, frame.width]);
  yScale.range([0, frame.height]);

  // x axis
  {
    frame.enter();
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(0, 0);
    context.lineTo(frame.width, 0);
    context.stroke();

    context.fillStyle = labelColor;
    context.font = labelFont;

    let prevBoundary = -padding.left;
    for (let i = 0; i < xTicks.length; i++) {
      const xTick = xTicks[i];
      const x = xScale(xTick);
      const y = 0;

      if (drawTicks) {
        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(x, y);
        context.lineTo(x, y - tickSize);
        context.stroke();
      }

      const text = xTickFormat(xTick);
      const { width: textWidth } = context.measureText(text);
      let startX = 0;
      if (i === 0) {
        startX = Math.max(x - textWidth / 2, -padding.left);
      } else if (i === xTicks.length - 1) {
        startX = Math.min(x - textWidth / 2, width - textWidth);
      } else {
        startX = x - textWidth / 2;
      }
      if (startX < prevBoundary) {
        continue; // doesn't fit, skip
      }
      frame.fillText(text, startX, y - xLabelOffset, {
        textAlign: "left",
        textBaseline: "top",
      });
      prevBoundary = startX + textWidth;
    }
    frame.exit();
  }

  // y axis
  if (!hideYAxis) {
    frame.enter();
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(0, 0);
    context.lineTo(0, frame.height);
    context.stroke();

    yTicks.forEach((d) => {
      context.beginPath();
      const x = 0;
      const y = yScale(d);
      if (drawTicks) {
        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(x, y);
        context.lineTo(x - tickSize, y);
        context.stroke();
      }
      frame.fillText(yTickFormat(d), x - yLabelOffset, y, {
        textAlign: "right",
        textBaseline: "middle",
        fillStyle: labelColor,
        font: labelFont,
      });
    });
    frame.exit();
  }

  return {
    xScale,
    yScale,
    xTickFormat,
    padding,
    frame,
  };
}

export function drawVerticalCursorLine({
  cursor,
  frame,
  xScale,
  tickFormat,
}: {
  cursor: Point; // original canvas coordinates
  frame: CartesianFrame;
  xScale: d3.ScaleContinuousNumeric<number, number, never>;
  tickFormat: (d: d3.NumberValue) => string;
}) {
  const context = frame.context;
  frame.enter();
  const point = frame.translatedPoint(cursor);

  context.beginPath();
  context.strokeStyle = cursorLineColor;
  context.lineWidth = 1;
  context.moveTo(point.x, 0);
  context.lineTo(point.x, frame.height);
  context.stroke();

  context.textAlign = "left";
  context.textBaseline = "bottom";
  const text = tickFormat(xScale.invert(point.x));
  const measured = context.measureText(text);

  const px = 4,
    py = 2,
    mx = 4,
    my = 4;

  let boxWidth = measured.width + px * 2;
  const boxHeight = measured.actualBoundingBoxAscent + py * 2;
  const boxOrigin: Point = {
    x: point.x + mx,
    y: my,
  };
  const flip =
    boxOrigin.x + boxWidth > frame.width &&
    // In pathological cases, we can't fit the box on either side because the text is too long.
    // In this case, we don't flip because first digits are more significant.
    boxWidth <= point.x;

  if (flip) {
    boxOrigin.x = cursor.x - mx;
    boxWidth = -boxWidth;
    context.textAlign = "right";
  }

  context.globalAlpha = 0.7;
  context.fillStyle = "white";
  context.fillRect(boxOrigin.x, boxOrigin.y, boxWidth, boxHeight);
  context.globalAlpha = 1;
  context.fillStyle = labelColor;
  frame.fillText(
    text,
    boxOrigin.x + px * (flip ? -1 : 1),
    // unsure why "-1" is needed, probably related to measureText result and could be fixed
    my + py - 1,
    {
      fillStyle: labelColor,
    }
  );
  frame.exit();
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
