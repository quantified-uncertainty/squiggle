import { FlexDirection } from "yoga-layout";

import { CanvasElement, CC, makeNode } from "./CanvasElement.js";
import { axisTitleColor, axisTitleFont } from "./styles.js";
import { drawElement, measureText } from "./utils.js";

type Props = {
  xAxisTitle?: string;
  yAxisTitle?: string;
  child: CanvasElement;
};

const textPadding = 3;

const setTextStyles = (context: CanvasRenderingContext2D) => {
  context.textAlign = "center";
  context.textBaseline = "top";
  context.font = axisTitleFont;
  context.fillStyle = axisTitleColor;
};

export const makeNull: CC = () => {
  const node = makeNode();

  return {
    node,
    draw: () => {},
  };
};

const VerticalText: CC<{ text: string }> = ({ text }) => {
  const node = makeNode();

  const measured = measureText({
    text,
    font: axisTitleFont,
  });
  node.setMinWidth(measured.actualBoundingBoxAscent + 2 * textPadding);

  return {
    node,
    draw: (context) => {
      // TODO: center the title vertically within the charting area
      context.rotate(-Math.PI / 2); // rotate 90 degrees counter-clockwise
      setTextStyles(context);
      context.fillText(text, -node.getComputedHeight() / 2, textPadding);
    },
  };
};

const makeText: CC<{ text: string }> = ({ text }) => {
  const node = makeNode();

  const measured = measureText({
    text,
    font: axisTitleFont,
  });
  node.setMinHeight(measured.actualBoundingBoxAscent + 2 * textPadding);

  return {
    node,
    draw: (context) => {
      setTextStyles(context);
      context.fillText(text, node.getComputedWidth() / 2, textPadding);
    },
  };
};

export const AxesTitlesContainer: CC<Props> = ({
  xAxisTitle,
  yAxisTitle,
  child,
}) => {
  // Column layout; y title, then chart + x title.
  // See also: `makeAxesContainer`, which uses a similar layout.
  const node = makeNode();
  node.setFlexDirection(FlexDirection.Row);

  const yTitle = yAxisTitle ? VerticalText({ text: yAxisTitle }) : makeNull({});

  node.insertChild(yTitle.node, 0);

  const childAndXTitle = makeNode();
  const xTitle = xAxisTitle ? makeText({ text: xAxisTitle }) : makeNull({});
  childAndXTitle.insertChild(child.node, 0);
  childAndXTitle.insertChild(xTitle.node, 1);

  childAndXTitle.setFlexGrow(1);
  node.insertChild(childAndXTitle, 1);

  return {
    node,
    draw: (context) => {
      drawElement(yTitle, context);

      {
        context.save();
        context.translate(
          childAndXTitle.getComputedLeft(),
          childAndXTitle.getComputedTop()
        );
        drawElement(child, context);
        drawElement(xTitle, context);

        context.restore();
      }
    },
  };
};
