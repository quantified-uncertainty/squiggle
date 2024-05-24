import { Dimensions } from "./types.js";

export abstract class CanvasElement {
  // absolute coordinates, usually determined by `layout()` method.
  x: number = 0;
  y: number = 0;

  width: number = 0;
  height: number = 0;

  abstract draw(context: CanvasRenderingContext2D): void;

  // Set own width and height if necessary (but not `x` and `y`, those are
  // managed by the parent element), and positions children.
  abstract layout(
    context: CanvasRenderingContext2D,
    recommendedSize: Dimensions
  ): void;
}
