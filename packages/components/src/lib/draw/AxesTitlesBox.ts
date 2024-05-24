import { CanvasElement } from "./CanvasElement.js";
import { axisTitleColor, axisTitleFont } from "./styles.js";
import { Dimensions } from "./types.js";

type Props = {
  xAxisTitle?: string;
  yAxisTitle?: string;
  child: CanvasElement;
};

export class AxesTitlesBox extends CanvasElement {
  textPadding = 3;

  constructor(public props: Props) {
    super();
  }

  private textHeight(context: CanvasRenderingContext2D) {
    context.font = axisTitleFont;
    context.fillStyle = axisTitleColor;
    return context.measureText("Text").actualBoundingBoxAscent;
  }

  private titleHeight(context: CanvasRenderingContext2D) {
    return this.textHeight(context) + this.textPadding * 2;
  }

  layout(context: CanvasRenderingContext2D, recommendedSize: Dimensions) {
    const { child } = this.props;

    const leftPadding = this.props.yAxisTitle ? this.titleHeight(context) : 0;
    const bottomPadding = this.props.xAxisTitle ? this.titleHeight(context) : 0;

    child.x = this.x + leftPadding;
    child.y = this.y;

    this.props.child.layout(context, {
      width: recommendedSize.width - leftPadding,
      height: recommendedSize.height - bottomPadding,
    });
    this.width = child.width + leftPadding;
    this.height = child.height + bottomPadding;
  }

  draw(context: CanvasRenderingContext2D) {
    // draw content first, then the titles on top
    this.props.child.draw(context);

    const setTextStyles = () => {
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.font = axisTitleFont;
      context.fillStyle = axisTitleColor;
    };

    if (this.props.xAxisTitle) {
      context.save();

      setTextStyles();
      context.fillText(
        this.props.xAxisTitle,
        this.x + this.width / 2,
        this.y - this.textPadding
      );

      context.restore();
    }

    if (this.props.yAxisTitle) {
      context.save();

      // center the title vertically within the charting area
      context.translate(this.x, this.y + this.props.child.height / 2);
      context.rotate(-Math.PI / 2); // rotate 90 degrees counter-clockwise

      setTextStyles();
      context.fillText(this.props.yAxisTitle, 0, this.textPadding);

      context.restore();
    }
  }
}
