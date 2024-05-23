import * as d3 from "d3";

import { CanvasFrame } from "./CanvasFrame.js";
import { guideLineColor, labelColor, labelFont } from "./styles.js";
import { Point } from "./types.js";

const TOOLTIP_OFFSETS = {
  px: 4,
  py: 2,
  mx: 4,
  my: 4,
};

export function drawVerticalGuideLine({
  scale,
  format,
  x,
  frame,
}: {
  scale: d3.ScaleContinuousNumeric<number, number, never>;
  format?: string | undefined;
  x: number;
  frame: CanvasFrame;
}) {
  const context = frame.context;
  frame.enter();

  context.beginPath();
  context.strokeStyle = guideLineColor;
  context.lineWidth = 1;
  context.setLineDash([5, 5]); // setting the dashed line pattern
  context.moveTo(x, 0);
  context.lineTo(x, frame.height);
  context.stroke();
  context.setLineDash([]); // resetting the dashed line pattern so it doesn't affect other lines

  context.textAlign = "left";
  context.textBaseline = "bottom";
  context.fillStyle = labelColor;
  context.font = labelFont;
  const text = scale.tickFormat(
    Infinity, // important for scaleLog; https://github.com/d3/d3-scale/tree/main#log_tickFormat
    format
  )(scale.invert(x));
  const measured = context.measureText(text);

  let boxWidth = measured.width + TOOLTIP_OFFSETS.px * 2;
  const boxHeight = measured.actualBoundingBoxAscent + TOOLTIP_OFFSETS.py * 2;
  const boxOrigin: Point = {
    x: x + TOOLTIP_OFFSETS.mx,
    y: TOOLTIP_OFFSETS.my,
  };
  const flip =
    boxOrigin.x + boxWidth > frame.width &&
    // In pathological cases, we can't fit the box on either side because the text is too long.
    // In this case, we don't flip because first digits are more significant.
    boxWidth <= x;

  if (flip) {
    boxOrigin.x = x - TOOLTIP_OFFSETS.mx;
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
    boxOrigin.x + TOOLTIP_OFFSETS.px * (flip ? -1 : 1),
    // unsure why "-1" is needed, probably related to measureText result and could be fixed
    TOOLTIP_OFFSETS.my + TOOLTIP_OFFSETS.py - 1,
    {
      fillStyle: labelColor,
    }
  );
  frame.exit();
}

export function drawHorizontalGuideLine({
  scale,
  format,
  y,
  frame,
}: {
  scale: d3.ScaleContinuousNumeric<number, number, never>;
  format?: string | undefined;
  y: number;
  frame: CanvasFrame;
}) {
  // TODO - copy-pasted from drawVerticalGuideLine
  const context = frame.context;
  frame.enter();

  context.beginPath();
  context.strokeStyle = guideLineColor;
  context.lineWidth = 1;
  context.setLineDash([5, 5]); // setting the dashed line pattern
  context.moveTo(0, y);
  context.lineTo(frame.width, y);
  context.stroke();
  context.setLineDash([]); // resetting the dashed line pattern so it doesn't affect other lines

  context.textAlign = "left";
  context.textBaseline = "bottom";
  context.fillStyle = labelColor;
  context.font = labelFont;
  const text = scale.tickFormat(
    Infinity, // important for scaleLog; https://github.com/d3/d3-scale/tree/main#log_tickFormat
    format
  )(scale.invert(y));
  const measured = context.measureText(text);

  const boxWidth = measured.width + TOOLTIP_OFFSETS.px * 2;
  let boxHeight = measured.actualBoundingBoxAscent + TOOLTIP_OFFSETS.py * 2;
  const boxOrigin: Point = {
    x: TOOLTIP_OFFSETS.mx,
    y: TOOLTIP_OFFSETS.my + y,
  };
  const flip = boxOrigin.y + boxHeight > frame.height;

  if (flip) {
    boxOrigin.y = y - TOOLTIP_OFFSETS.mx;
    boxHeight = -boxHeight;
    context.textBaseline = "top";
  }

  context.globalAlpha = 0.7;
  context.fillStyle = "white";
  context.fillRect(boxOrigin.x, boxOrigin.y, boxWidth, boxHeight);
  context.globalAlpha = 1;
  context.fillStyle = labelColor;
  frame.fillText(
    text,
    TOOLTIP_OFFSETS.mx + TOOLTIP_OFFSETS.px,
    boxOrigin.y + TOOLTIP_OFFSETS.py * (flip ? -1 : 1) - 1,
    {
      fillStyle: labelColor,
    }
  );
  frame.exit();
}

export function drawCursorGuideLines({
  cursor,
  frame,
  x: xLine,
  y: yLine,
}: {
  // original canvas coordinates;
  // can be undefined for convenience (this function will check if cursor lines are necessary)
  cursor?: Point;
  frame: CanvasFrame;
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

  const point = frame.translatedPoint(cursor);

  if (xLine) {
    drawVerticalGuideLine({
      frame,
      scale: xLine.scale,
      format: xLine.format,
      x: point.x,
    });
  }

  if (yLine) {
    drawHorizontalGuideLine({
      frame,
      scale: yLine.scale,
      format: yLine.format,
      y: point.y,
    });
  }
}
