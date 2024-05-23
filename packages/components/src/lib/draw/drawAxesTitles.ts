import { CanvasFrame } from "./CanvasFrame.js";
import { axisTitleColor, axisTitleFont } from "./styles.js";
import { Padding } from "./types.js";

export function drawAxesTitles({
  frame,
  xAxisTitle,
  yAxisTitle,
}: {
  frame: CanvasFrame;
  xAxisTitle?: string;
  yAxisTitle?: string;
}) {
  const { context } = frame;

  if (frame.yDirection === "down") {
    frame = frame.flip();
  }

  const padding: Padding = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  let textHeight: number;
  {
    context.font = axisTitleFont;
    context.fillStyle = axisTitleColor;
    textHeight = context.measureText("Text").actualBoundingBoxAscent;
  }

  const textPadding = 3;

  // TODO - measure text size precisely
  if (yAxisTitle) {
    padding.left += textHeight + textPadding * 2;
  }
  if (xAxisTitle) {
    padding.bottom += textHeight + textPadding * 2;
  }

  if (xAxisTitle) {
    frame.enter();
    frame.fillText(xAxisTitle, frame.width / 2 + padding.left, textPadding, {
      textAlign: "center",
      textBaseline: "bottom",
      font: axisTitleFont,
      fillStyle: axisTitleColor,
    });
    frame.exit();
  }
  if (yAxisTitle) {
    context.save(); // save the current context state

    // center the title vertically within the charting area
    context.translate(frame.x0, (frame.height - padding.bottom) / 2);
    context.rotate(-Math.PI / 2); // rotate 90 degrees counter-clockwise
    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = axisTitleFont;
    context.fillStyle = axisTitleColor;
    context.fillText(yAxisTitle, 0, textPadding);

    context.restore(); // restore the context state to before rotation and translation
  }

  const innerFrame = frame.subframeWithPadding(padding);
  return {
    innerFrame,
  };
}
