import { useCallback, useEffect, useMemo, useRef } from "react";

import { DrawContext, DrawFunction, useCanvas } from "../hooks/useCanvas.js";
import { CanvasElement } from "./CanvasElement.js";
import { CanvasFrame } from "./CanvasFrame.js";
import { Padding, Point } from "./types.js";

export function distance(point1: Point, point2: Point) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
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
  return new CanvasFrame({
    context,
    x0: padding.left,
    y0: height - padding.bottom,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom,
  });
}

export function measureText(params: { text: string; font: string }) {
  // TODO - cache canvas
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create canvas context");
  }
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
  context.font = params.font;
  return context.measureText(params.text);
}

export function drawElement(
  element: CanvasElement<object | null>,
  context: CanvasRenderingContext2D
) {
  // note that we don't take `right` and `bottom`; they seem broken in current yoga-layout (always zero)
  const { width, height, left, top } = element.node.getComputedLayout();

  context.save();
  context.translate(left, top);

  element.draw(context, { width, height, left, top });

  context.restore();
}

// converts the absolute point coordinates (absolute relative to canvas) to the coordinates in the current context transform
export function getLocalPoint(context: CanvasRenderingContext2D, point: Point) {
  const devicePixelRatio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio;

  const domPoint = new DOMPoint(
    point.x * devicePixelRatio,
    point.y * devicePixelRatio
  ).matrixTransform(context.getTransform().inverse());
  return { x: domPoint.x, y: domPoint.y };
}

export function useYogaCanvas(
  element: CanvasElement,
  opts: {
    init?: DrawFunction;
  } = {}
) {
  const draw = useCallback(
    ({ context, width, height }: DrawContext) => {
      context.clearRect(0, 0, width, height);
      drawElement(element, context);
    },
    [element]
  );

  const outerRef = useRef<HTMLDivElement>(null);
  const width = outerRef.current?.clientWidth;

  const elementWithCalculatedLayout = useMemo(() => {
    if (width === undefined) {
      return undefined;
    }
    element.node.calculateLayout(width, undefined);
    return element;
  }, [element, width]);

  const { ref } = useCanvas({
    height: elementWithCalculatedLayout?.node.getComputedHeight() ?? 0, // TODO - support `initialHeight` to miminize the reflows
    init: opts?.init,
    draw,
  });

  useEffect(() => {
    // Yoga doesn't have garbage collection; https://www.yogalayout.dev/docs/getting-started/laying-out-a-tree#building-a-yoga-tree
    return () => element.node.freeRecursive();
  }, [element.node]);

  return { outerRef, ref };
}
