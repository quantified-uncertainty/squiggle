import * as d3 from "d3";
import { CartesianFrame } from "./CartesianFrame.js";

const axisColor = "rgba(114, 125, 147, 0.1)";
export const labelColor = "rgb(114, 125, 147)";
export const cursorLineColor = "#f87171"; // tailwind red-400
export const primaryColor = "#4c78a8"; // for lines and areas
const labelFont = "10px sans-serif";
const xLabelOffset = 6;
const yLabelOffset = 6;

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

  const frame = new CartesianFrame({
    context,
    x0: padding.left,
    y0: padding.top + chartHeight,
  });

  // x axis
  {
    frame.enter();
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(0, 0);
    context.lineTo(chartWidth, 0);
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
    context.lineTo(0, chartHeight);
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
    chartWidth,
    chartHeight,
    frame,
  };
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
