import { CartesianFrame } from "./CartesianFrame.js";
import { Padding, Point } from "./types.js";

export function distance(point1: Point, point2: Point) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

export function calculatePadding({
  suggestedPadding,
  hasXAxisTitle,
  hasYAxisTitle,
}: {
  suggestedPadding: Padding;
  hasXAxisTitle: boolean;
  hasYAxisTitle: boolean;
}): Padding {
  const padding: Padding = { ...suggestedPadding };
  if (hasXAxisTitle) {
    padding.bottom = padding.bottom + 20;
  }
  if (hasYAxisTitle) {
    padding.left = padding.left + 35;
  }
  return padding;
}

export function makeCartesianFrame({
  context,
  padding,
  width,
  height,
}: {
  context: CanvasRenderingContext2D;
  padding: Padding;
  width: number;
  height: number;
}) {
  return new CartesianFrame({
    context,
    x0: padding.left,
    y0: height - padding.bottom,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom,
  });
}
