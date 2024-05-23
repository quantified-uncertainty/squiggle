import * as d3 from "d3";

import { defaultTickFormatSpecifier } from "../d3/patchedScales.js";
import { CanvasFrame } from "./CanvasFrame.js";
import { drawAxesTitles } from "./drawAxesTitles.js";
import { axisColor, labelColor, labelFont } from "./styles.js";
import { Padding } from "./types.js";

const xLabelOffset = 6;
const yLabelOffset = 6;

export const tickCountInterpolator = d3
  .scaleLinear()
  .domain([40000, 1000000]) // The potential width*height of the chart
  .range([3, 16]) // The range of circle radiuses
  .clamp(true);

type AnyNumericScale = d3.ScaleContinuousNumeric<number, number, never>;

type DrawAxesParams = {
  frame: CanvasFrame;
  xScale: AnyNumericScale;
  yScale: AnyNumericScale;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showAxisLines?: boolean;
  xTickCount?: number;
  yTickCount?: number;
  xTickFormat?: string;
  yTickFormat?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
};

export function drawAxes({
  frame,
  xScale, // will be mutated with the correct range
  yScale,
  showYAxis = true,
  showXAxis = true,
  showAxisLines: _showAxisLines,
  xTickCount: _xTickCount,
  yTickCount: _yTickCount,
  xTickFormat: xTickFormatSpecifier = defaultTickFormatSpecifier,
  yTickFormat: yTickFormatSpecifier = defaultTickFormatSpecifier,
  xAxisTitle,
  yAxisTitle,
}: DrawAxesParams) {
  const { innerFrame } = drawAxesTitles({
    frame,
    xAxisTitle,
    yAxisTitle,
  });
  const { context, width, height } = innerFrame;

  const showAxisLines = _showAxisLines ?? (height > 150 && width > 150);
  const xTickCount = _xTickCount || tickCountInterpolator(width * height);
  const yTickCount = _yTickCount || tickCountInterpolator(height * width);

  const xTicks = xScale.ticks(xTickCount);
  const xTickFormat = xScale.tickFormat(xTickCount, xTickFormatSpecifier);

  const yTicks = yScale.ticks(yTickCount);
  const yTickFormat = yScale.tickFormat(yTickCount, yTickFormatSpecifier);

  const tickSize = 2;

  const padding: Padding = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  // update padding to fit things outside of the main cartesian frame
  {
    // measure x tick sizes for dynamic padding
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

    if (showXAxis) {
      padding.bottom += 20; // TODO - measure
    }
  }

  const mainFrame = innerFrame.subframeWithPadding(padding);

  xScale.range([0, mainFrame.width]);
  yScale.range([0, mainFrame.height]);

  // x axis
  if (showXAxis) {
    mainFrame.enter();
    if (showAxisLines) {
      context.beginPath();
      context.strokeStyle = axisColor;
      context.lineWidth = 1;
      context.moveTo(0, yScale(0));
      context.lineTo(mainFrame.width, yScale(0));
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
        startX = Math.min(x - textWidth / 2, mainFrame.width - textWidth);
      } else {
        startX = x - textWidth / 2;
      }
      if (startX < prevBoundary) {
        continue; // doesn't fit, skip
      }
      mainFrame.fillText(text, startX, y - xLabelOffset, {
        textAlign: "left",
        textBaseline: "top",
      });
      prevBoundary = startX + textWidth;
    }
    mainFrame.exit();
  }

  // y axis
  if (showYAxis) {
    mainFrame.enter();
    if (showAxisLines) {
      context.beginPath();
      context.strokeStyle = axisColor;
      context.lineWidth = 1;
      context.moveTo(0, 0);
      context.lineTo(0, mainFrame.height);
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
        startY = Math.min(y - textHeight / 2, mainFrame.height - textHeight);
      } else {
        startY = y - textHeight / 2;
      }

      if (startY < prevBoundary) {
        continue; // doesn't fit, skip
      }
      mainFrame.fillText(text, x - yLabelOffset, startY - 1, {
        textAlign: "right",
        textBaseline: "bottom",
        fillStyle: labelColor,
        font: labelFont,
      });
      prevBoundary = startY + textHeight;
    }
    mainFrame.exit();
  }

  return {
    xScale,
    yScale,
    xTickFormat,
    frame: mainFrame,
  };
}
