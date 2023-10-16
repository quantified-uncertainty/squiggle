import * as d3 from "d3";
import { CartesianFrame } from "./CartesianFrame.js";
import { Padding, Point } from "./types.js";
import { defaultTickFormatSpecifier } from "../d3/patchedScales.js";

const axisColor = "rgba(114, 125, 147, 0.1)";
export const labelColor = "rgb(114, 125, 147)";
export const cursorLineColor = "#888";
export const primaryColor = "#4c78a8"; // for lines and areas
export const distributionColor = "#6d9bce"; // for distributions. Slightly lighter than primaryColor
export const axisTitleColor = "rgb(100 116 139)";
export const axisTitleFont = "bold 12px ui-sans-serif, system-ui";
const labelFont = "10px sans-serif";
const xLabelOffset = 6;
const yLabelOffset = 6;

export type AnyChartScale = d3.ScaleContinuousNumeric<number, number, never>;

export function distance(point1: Point, point2: Point) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

interface DrawAxesParams {
  context: CanvasRenderingContext2D;
  xScale: AnyChartScale;
  yScale: AnyChartScale;
  suggestedPadding: Padding;
  width: number;
  height: number;
  hideYAxis?: boolean;
  drawTicks?: boolean;
  xTickCount?: number;
  yTickCount?: number;
  xTickFormat?: string;
  yTickFormat?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
}

export function drawAxes({
  context,
  xScale, // will be mutated with the correct range
  yScale,
  suggestedPadding,
  width,
  height,
  hideYAxis = false,
  drawTicks = true,
  xTickCount = Math.max(Math.min(Math.floor(width / 100), 12), 3),
  yTickCount = Math.max(Math.min(Math.floor(height / 100), 12), 3),
  xTickFormat: xTickFormatSpecifier = defaultTickFormatSpecifier,
  yTickFormat: yTickFormatSpecifier = defaultTickFormatSpecifier,
  xAxisTitle,
  yAxisTitle,
}: DrawAxesParams) {
  const xTicks = xScale.ticks(xTickCount);
  const xTickFormat = xScale.tickFormat(xTickCount, xTickFormatSpecifier);

  const yTicks = yScale.ticks(yTickCount);
  const yTickFormat = yScale.tickFormat(yTickCount, yTickFormatSpecifier);

  const tickSize = 2;

  const padding: Padding = { ...suggestedPadding };
  if (xAxisTitle) {
    padding.bottom = padding.bottom + 20;
  }
  if (yAxisTitle) {
    padding.left = padding.left + 35;
  }

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
      if (text === "") {
        continue; // we're probably rendering scaleLog, which has empty labels
      }
      const { width: textWidth } = context.measureText(text);
      let startX = 0;
      if (i === 0) {
        startX = Math.max(x - textWidth / 2, prevBoundary);
      } else if (i === xTicks.length - 1) {
        startX = Math.min(x - textWidth / 2, frame.width - textWidth);
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

    let prevBoundary = -padding.bottom;
    const x = 0;
    for (let i = 0; i < yTicks.length; i++) {
      const yTick = yTicks[i];
      context.beginPath();
      const y = yScale(yTick);

      const text = yTickFormat(yTick);
      context.textBaseline = "bottom";
      const { actualBoundingBoxAscent: textHeight } = context.measureText(text);

      if (drawTicks) {
        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(x, y);
        context.lineTo(x - tickSize, y);
        context.stroke();
      }

      let startY = 0;
      if (i === 0) {
        startY = Math.max(y - textHeight / 2, prevBoundary);
      } else if (i === yTicks.length - 1) {
        startY = Math.min(y - textHeight / 2, frame.height - textHeight);
      } else {
        startY = y - textHeight / 2;
      }

      if (startY < prevBoundary) {
        continue; // doesn't fit, skip
      }
      frame.fillText(text, x - yLabelOffset, startY - 1, {
        textAlign: "right",
        textBaseline: "bottom",
        fillStyle: labelColor,
        font: labelFont,
      });
      prevBoundary = startY + textHeight;
    }
    frame.exit();
  }

  if (xAxisTitle) {
    const chartWidth = width - padding.left - padding.right; // Actual charting area width
    const titleX = padding.left + chartWidth / 2; // center the title within the charting area
    const titleY = height - padding.bottom + 33; // adjust this value based on desired distance from x-axis
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.font = axisTitleFont;
    context.fillStyle = axisTitleColor;
    context.fillText(xAxisTitle, titleX, titleY);
  }
  if (yAxisTitle) {
    const chartHeight = height - padding.top - padding.bottom; // Actual charting area height
    const titleY = padding.top + chartHeight / 2; // center the title vertically within the charting area
    const titleX = 0;
    context.save(); // save the current context state
    context.translate(titleX, titleY);
    context.rotate(-Math.PI / 2); // rotate 90 degrees counter-clockwise
    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = axisTitleFont;
    context.fillStyle = axisTitleColor;
    context.fillText(yAxisTitle, 0, 0);
    context.restore(); // restore the context state to before rotation and translation
  }

  return {
    xScale,
    yScale,
    xTickFormat,
    padding,
    frame,
  };
}

export function drawCursorLines({
  cursor,
  frame,
  x: xLine,
  y: yLine,
}: {
  // original canvas coordinates;
  // can be undefined for convenience (this function will check if cursor lines are necessary)
  cursor?: Point;
  frame: CartesianFrame;
  x?: {
    scale: d3.ScaleContinuousNumeric<number, number, never>;
    format?: string | undefined;
  };
  y?: {
    scale: d3.ScaleContinuousNumeric<number, number, never>;
    format?: string | undefined;
  };
}) {
  if (!cursor || !frame.containsPoint(cursor)) {
    return;
  }

  const context = frame.context;
  frame.enter();
  const point = frame.translatedPoint(cursor);

  const px = 4,
    py = 2,
    mx = 4,
    my = 4;

  if (xLine) {
    context.beginPath();
    context.strokeStyle = cursorLineColor;
    context.lineWidth = 1;
    context.setLineDash([5, 5]); // setting the dashed line pattern
    context.moveTo(point.x, 0);
    context.lineTo(point.x, frame.height);
    context.stroke();
    context.setLineDash([]); // resetting the dashed line pattern so it doesn't affect other lines

    context.textAlign = "left";
    context.textBaseline = "bottom";
    const text = xLine.scale.tickFormat(
      Infinity, // important for scaleLog; https://github.com/d3/d3-scale/tree/main#log_tickFormat
      xLine.format
    )(xLine.scale.invert(point.x));
    const measured = context.measureText(text);

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
      boxOrigin.x = point.x - mx;
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
  }

  // TODO - simplify / remove copy-paste
  if (yLine) {
    context.beginPath();
    context.strokeStyle = cursorLineColor;
    context.lineWidth = 1;
    context.setLineDash([5, 5]); // setting the dashed line pattern
    context.moveTo(0, point.y);
    context.lineTo(frame.width, point.y);
    context.stroke();
    context.setLineDash([]); // resetting the dashed line pattern so it doesn't affect other lines

    context.textAlign = "left";
    context.textBaseline = "bottom";
    const text = yLine.scale.tickFormat(
      Infinity, // important for scaleLog; https://github.com/d3/d3-scale/tree/main#log_tickFormat
      yLine.format
    )(yLine.scale.invert(point.y));
    const measured = context.measureText(text);

    const boxWidth = measured.width + px * 2;
    let boxHeight = measured.actualBoundingBoxAscent + py * 2;
    const boxOrigin: Point = {
      x: mx,
      y: my + point.y,
    };
    const flip = boxOrigin.y + boxHeight > frame.height;

    if (flip) {
      boxOrigin.y = point.y - mx;
      boxHeight = -boxHeight;
      context.textBaseline = "top";
    }

    context.globalAlpha = 0.7;
    context.fillStyle = "white";
    context.fillRect(boxOrigin.x, boxOrigin.y, boxWidth, boxHeight);
    context.globalAlpha = 1;
    context.fillStyle = labelColor;
    frame.fillText(text, mx + px, boxOrigin.y + py * (flip ? -1 : 1) - 1, {
      fillStyle: labelColor,
    });
  }
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
