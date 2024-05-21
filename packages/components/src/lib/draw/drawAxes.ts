import * as d3 from "d3";

import { defaultTickFormatSpecifier } from "../d3/patchedScales.js";
import { CartesianFrame } from "./CartesianFrame.js";
import {
  axisColor,
  axisTitleColor,
  axisTitleFont,
  labelColor,
} from "./colors.js";
import { Padding } from "./types.js";
import { calculatePadding, makeCartesianFrame } from "./utils.js";

const labelFont = "10px sans-serif";
const xLabelOffset = 6;
const yLabelOffset = 6;

export const tickCountInterpolator = d3
  .scaleLinear()
  .domain([40000, 1000000]) // The potential width*height of the chart
  .range([3, 16]) // The range of circle radiuses
  .clamp(true);

type AnyNumericScale = d3.ScaleContinuousNumeric<number, number, never>;

type DrawAxesParams = {
  context: CanvasRenderingContext2D;
  xScale: AnyNumericScale;
  yScale: AnyNumericScale;
  suggestedPadding: Padding;
  width: number;
  height: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showAxisLines?: boolean;
  xTickCount?: number;
  yTickCount?: number;
  xTickFormat?: string;
  yTickFormat?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  frame?: CartesianFrame;
};

export function drawAxes({
  context,
  xScale, // will be mutated with the correct range
  yScale,
  suggestedPadding,
  width,
  height,
  showYAxis = true,
  showXAxis = true,
  showAxisLines = height > 150 && width > 150,
  xTickCount: _xTickCount,
  yTickCount: _yTickCount,
  xTickFormat: xTickFormatSpecifier = defaultTickFormatSpecifier,
  yTickFormat: yTickFormatSpecifier = defaultTickFormatSpecifier,
  xAxisTitle,
  yAxisTitle,
  frame: _frame,
}: DrawAxesParams) {
  const xTickCount = _xTickCount || tickCountInterpolator(width * height);
  const yTickCount = _yTickCount || tickCountInterpolator(height * width);

  const xTicks = xScale.ticks(xTickCount);
  const xTickFormat = xScale.tickFormat(xTickCount, xTickFormatSpecifier);

  const yTicks = yScale.ticks(yTickCount);
  const yTickFormat = yScale.tickFormat(yTickCount, yTickFormatSpecifier);

  const tickSize = 2;

  const padding: Padding = calculatePadding({
    suggestedPadding,
    hasXAxisTitle: !!xAxisTitle,
    hasYAxisTitle: !!yAxisTitle,
  });

  // measure tick sizes for dynamic padding
  if (showYAxis) {
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

  const frame =
    _frame || makeCartesianFrame({ context, padding, width, height });

  xScale.range([0, frame.width]);
  yScale.range([0, frame.height]);

  // x axis
  if (showXAxis) {
    frame.enter();
    if (showAxisLines) {
      context.beginPath();
      context.strokeStyle = axisColor;
      context.lineWidth = 1;
      context.moveTo(0, yScale(0));
      context.lineTo(frame.width, yScale(0));
      context.stroke();
    }

    context.fillStyle = labelColor;
    context.font = labelFont;

    let prevBoundary = -padding.left;
    for (let i = 0; i < xTicks.length; i++) {
      const xTick = xTicks[i];
      const x = xScale(xTick);
      const y = yScale(0);

      context.beginPath();
      context.strokeStyle = labelColor;
      context.lineWidth = 1;
      context.moveTo(x, y);
      context.lineTo(x, y - tickSize);
      context.stroke();

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
  if (showYAxis) {
    frame.enter();
    if (showAxisLines) {
      context.beginPath();
      context.strokeStyle = axisColor;
      context.lineWidth = 1;
      context.moveTo(0, 0);
      context.lineTo(0, frame.height);
      context.stroke();
    }

    let prevBoundary = -padding.bottom;
    const x = 0;
    for (let i = 0; i < yTicks.length; i++) {
      const yTick = yTicks[i];
      context.beginPath();
      const y = yScale(yTick);

      const text = yTickFormat(yTick);
      context.textBaseline = "bottom";
      const { actualBoundingBoxAscent: textHeight } = context.measureText(text);

      context.beginPath();
      context.strokeStyle = labelColor;
      context.lineWidth = 1;
      context.moveTo(x, y);
      context.lineTo(x - tickSize, y);
      context.stroke();

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
