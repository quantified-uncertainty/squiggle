import * as d3 from "d3";
import { Edge, PositionType } from "yoga-layout";

import { defaultTickFormatSpecifier } from "../d3/patchedScales.js";
import { AnyNumericScale } from "./AxesBox.js";
import { CanvasElement, CC, makeNode } from "./CanvasElement.js";
import { guideLineColor, labelColor, labelFont } from "./styles.js";
import { Point } from "./types.js";
import { drawElement, getLocalPoint } from "./utils.js";

const TOOLTIP_OFFSETS = {
  px: 4,
  py: 2,
  mx: 4,
  my: 4,
};

type ValueMode = "absolute-x" | "absolute-y" | "relative" | "domain";

function valueToRelative({
  value,
  mode,
  context,
  scale,
}: {
  value: number;
  mode: ValueMode;
  context: CanvasRenderingContext2D;
  scale: AnyNumericScale;
}): number {
  switch (mode) {
    case "relative":
      return value;
    case "absolute-x":
      return getLocalPoint(context, { x: value, y: 0 }).x;
    case "absolute-y":
      return getLocalPoint(context, { x: 0, y: value }).y;
    case "domain":
      return scale(value);
    default:
      throw mode satisfies never;
  }
}

export const VerticalGuideLine: CC<{
  scale: d3.ScaleContinuousNumeric<number, number, never>;
  format?: string | undefined;
  value: number;
  mode: ValueMode;
}> = ({ scale: _scale, format, value, mode }) => {
  const node = makeNode();

  return {
    node,
    draw: (context, layout) => {
      const scale = _scale.copy().range([0, layout.width]);

      const x = valueToRelative({
        value,
        mode,
        context,
        scale,
      });

      if (x < 0 || x > layout.width) {
        return;
      }

      // 1. line
      context.save();
      context.beginPath();
      context.strokeStyle = guideLineColor;
      context.lineWidth = 1;
      context.setLineDash([5, 5]); // setting the dashed line pattern
      context.moveTo(x, layout.height);
      context.lineTo(x, 0);
      context.stroke();
      context.restore();

      // 2. measure label
      context.textAlign = "left";
      context.textBaseline = "bottom";
      context.fillStyle = labelColor;
      context.font = labelFont;
      const text = scale.tickFormat(
        Infinity, // important for scaleLog; https://github.com/d3/d3-scale/tree/main#log_tickFormat
        format
      )(scale.invert(x));
      const measured = context.measureText(text);
      const textHeight = measured.actualBoundingBoxAscent;
      const textWidth = measured.width;

      // 3. semi-transparent box
      let boxWidth = textWidth + TOOLTIP_OFFSETS.px * 2;
      const boxHeight = textHeight + TOOLTIP_OFFSETS.py * 2;
      const boxOrigin: Point = {
        x: x + TOOLTIP_OFFSETS.mx,
        y: layout.height - TOOLTIP_OFFSETS.my - boxHeight,
      };
      const flip =
        boxOrigin.x + boxWidth > layout.width &&
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

      // 4. render label
      context.fillStyle = labelColor;
      context.fillText(
        text,
        boxOrigin.x + TOOLTIP_OFFSETS.px * (flip ? -1 : 1),
        // unsure why "+1" is needed, probably related to measureText result and could be fixed
        boxOrigin.y + boxHeight - TOOLTIP_OFFSETS.py + 1
      );
    },
  };
};

export const HorizontalGuideLine: CC<{
  scale: d3.ScaleContinuousNumeric<number, number, never>;
  format?: string | undefined;
  value: number;
  mode: ValueMode;
}> = ({ scale, format, value, mode }) => {
  const node = makeNode();
  return {
    node,
    draw: (context, layout) => {
      const y = valueToRelative({
        value,
        mode,
        context,
        scale,
      });

      if (y < 0 || y > layout.height) {
        return;
      }

      context.beginPath();
      context.strokeStyle = guideLineColor;
      context.lineWidth = 1;
      context.setLineDash([5, 5]); // setting the dashed line pattern
      context.moveTo(0, y);
      context.lineTo(layout.width, y);
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
      const flip = boxOrigin.y + boxHeight > layout.height;

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
      context.fillText(
        text,
        TOOLTIP_OFFSETS.mx + TOOLTIP_OFFSETS.px,
        boxOrigin.y + TOOLTIP_OFFSETS.py * (flip ? -1 : 1) - 1
      );
    },
  };
};

export const CursorGuideLines: CC<{
  // original canvas coordinates;
  // can be undefined for convenience (this function will check if cursor lines are necessary)
  cursor?: Point;
  x?: {
    scale: d3.ScaleContinuousNumeric<number, number, never>;
    format?: string | undefined;
  };
  y?: {
    scale: d3.ScaleContinuousNumeric<number, number, never>;
    format?: string | undefined;
  };
}> = ({ cursor, x: xLine, y: yLine }) => {
  const node = makeNode();

  let vertical: CanvasElement;
  if (cursor && xLine) {
    vertical = VerticalGuideLine({
      scale: xLine.scale,
      format: xLine.format ?? defaultTickFormatSpecifier,
      value: cursor.x,
      mode: "absolute-x",
    });
    vertical.node.setPositionType(PositionType.Absolute);
    vertical.node.setPosition(Edge.All, 0);
    node.insertChild(vertical.node, node.getChildCount());
  }

  let horizontal: CanvasElement;
  if (cursor && yLine) {
    horizontal = HorizontalGuideLine({
      scale: yLine.scale,
      format: yLine.format ?? defaultTickFormatSpecifier,
      value: cursor.y,
      mode: "absolute-y",
    });
    horizontal.node.setPositionType(PositionType.Absolute);
    horizontal.node.setPosition(Edge.All, 0);
    node.insertChild(horizontal.node, node.getChildCount());
  }

  return {
    node,
    draw: (context) => {
      if (vertical) drawElement(vertical, context);
      if (horizontal) drawElement(horizontal, context);
    },
  };
};
