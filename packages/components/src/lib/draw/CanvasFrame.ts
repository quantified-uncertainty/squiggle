import { Padding, Point } from "./types.js";

type TextOptions = {
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  font?: string;
  fillStyle?: string;
};

/*
 * Usage example:
 *
 * frame.enter(); // Entering the frame
 *
 * // Draw your 2D charts here
 *
 * frame.drawText('Label', 100, 50, { textAlign: 'center', textBaseline: 'middle', font: '14px Arial', fillStyle: 'blue' });
 *
 * frame.exit(); // Exiting the frame
 */

/*
 * `down` is the default for HTML canvas - (0,0) is at top-left corner.
 *
 * For drawing charts, though, it's useful to flip the direction to `up`, with
 * (0,0) in bottom-left corner.
 *
 * Note that this only affects the frame's internal coordinates that you get by
 * calling `frame.enter()`. `frame.y0` always points to the frame's top compared
 * to the canvas, to simplify the math.
 */

type YDirection = "up" | "down";

export function contextWidthHeight(context: CanvasRenderingContext2D) {
  const devicePixelRatio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio;

  return {
    width: context.canvas.width / devicePixelRatio,
    height: context.canvas.height / devicePixelRatio,
  };
}

export class CanvasFrame {
  public context: CanvasRenderingContext2D;
  public x0: number;
  public y0: number;
  public width: number;
  public height: number;
  public yDirection: YDirection = "up";

  constructor(props: {
    context: CanvasRenderingContext2D;
    x0: number;
    y0: number;
    width: number;
    height: number;
    yDirection?: YDirection;
  }) {
    this.context = props.context;
    this.x0 = props.x0;
    this.y0 = props.y0;
    this.width = props.width;
    this.height = props.height;
    this.yDirection = props.yDirection ?? "up";
  }

  padding(): Padding {
    const contextSizes = contextWidthHeight(this.context);
    return {
      left: this.x0,
      right: contextSizes.width - this.x0 - this.width,
      top: this.y0,
      bottom: contextSizes.height - this.y0 - this.height,
    };
  }

  static fullFrame(context: CanvasRenderingContext2D) {
    const { width, height } = contextWidthHeight(context);
    return new CanvasFrame({
      context,
      x0: 0,
      y0: 0,
      width,
      height,
      yDirection: "down",
    });
  }

  flip(): CanvasFrame {
    return new CanvasFrame({
      context: this.context,
      x0: this.x0,
      y0: this.y0,
      width: this.width,
      height: this.height,
      yDirection: this.yDirection === "up" ? "down" : "up",
    });
  }

  subframeWithPadding(padding: Padding): CanvasFrame {
    return new CanvasFrame({
      context: this.context,
      x0: this.x0 + padding.left,
      y0: this.y0 + padding.top,
      width: this.width - padding.left - padding.right,
      height: this.height - padding.top - padding.bottom,
      yDirection: this.yDirection,
    });
  }

  // Useful for converting cursor coordinates to frame.
  translatedPoint(point: Point): Point {
    return {
      x: point.x - this.x0,
      y:
        this.yDirection === "down"
          ? point.y - this.y0
          : this.y0 + this.height - point.y,
    };
  }

  // `point` is in global canvas coordinates, e.g. `cursor` from `useCanvasCursor()`
  containsPoint(point: Point): boolean {
    const translated = this.translatedPoint(point);
    return (
      translated.x >= 0 &&
      translated.x <= this.width &&
      translated.y >= 0 &&
      translated.y <= this.height
    );
  }

  // Note: `using framed = frame.enter()` would be good after
  // https://github.com/tc39/proposal-explicit-resource-management is widely
  // supported.
  enter() {
    this.context.save();
    this.context.translate(
      this.x0,
      this.yDirection === "up" ? this.y0 + this.height : this.y0
    );
    if (this.yDirection === "up") {
      this.context.scale(1, -1);
    }
  }

  exit() {
    this.context.restore();
  }

  fillText(text: string, x: number, y: number, options: TextOptions = {}) {
    this.context.save();
    if (this.yDirection === "up") {
      this.context.scale(1, -1); // Invert the scale for the text rendering
    }
    if (options.textAlign !== undefined) {
      this.context.textAlign = options.textAlign;
    }
    if (options.font !== undefined) {
      this.context.font = options.font;
    }
    if (options.fillStyle !== undefined) {
      this.context.fillStyle = options.fillStyle;
    }
    if (options.textBaseline !== undefined) {
      this.context.textBaseline = options.textBaseline; // TODO - does this make sense in both yDirection modes?
    }
    this.context.fillText(text, x, this.yDirection === "up" ? -y : y);
    this.context.restore();
  }
}
