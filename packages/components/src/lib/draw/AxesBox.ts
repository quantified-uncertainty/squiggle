import * as d3 from "d3";

import { defaultTickFormatSpecifier } from "../d3/patchedScales.js";
import { CanvasElement } from "./CanvasElement.js";
import { axisColor, labelColor, labelFont } from "./styles.js";
import { Dimensions } from "./types.js";

const xLabelOffset = 6;
const yLabelOffset = 6;

export const tickCountInterpolator = d3
  .scaleLinear()
  .domain([40000, 1000000]) // The potential width*height of the chart
  .range([3, 16]) // The range of circle radiuses
  .clamp(true);

type AnyNumericScale = d3.ScaleContinuousNumeric<number, number, never>;

type Props = {
  xScale: AnyNumericScale;
  yScale: AnyNumericScale;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showAxisLines?: boolean;
  xTickCount?: number;
  yTickCount?: number;
  xTickFormat?: string;
  yTickFormat?: string;
  child: CanvasElement;
};

const defaultProps: Partial<Props> = {
  showYAxis: true,
  showXAxis: true,
};

type DerivedProps = {
  xScale: AnyNumericScale; // copy of props.xScale with the appropriate range
  yScale: AnyNumericScale;
  showAxisLines: boolean;
  xTickCount: number;
  yTickCount: number;
  xTicks: number[];
  yTicks: number[];
  xTickFormat: (x: number) => string;
  yTickFormat: (x: number) => string;
};

export class AxesBox extends CanvasElement {
  props: Props;
  derivedProps: DerivedProps | undefined;

  constructor(props: Props) {
    super();
    this.props = {
      ...props,
    };
    for (const [key, value] of Object.entries(defaultProps)) {
      if (this.props[key] === undefined) {
        this.props[key] = value;
      }
    }
  }

  computeDerivedProps({ width, height }: Dimensions) {
    const showAxisLines =
      this.props.showAxisLines ?? (height > 150 && width > 150);

    const xTickCount =
      this.props.xTickCount || tickCountInterpolator(width * height);
    const yTickCount =
      this.props.yTickCount || tickCountInterpolator(height * width);

    const xTicks = this.props.xScale.ticks(xTickCount);
    const xTickFormat = this.props.xScale.tickFormat(
      xTickCount,
      this.props.xTickFormat ?? defaultTickFormatSpecifier
    );

    const yTicks = this.props.yScale.ticks(yTickCount);
    const yTickFormat = this.props.yScale.tickFormat(
      yTickCount,
      this.props.yTickFormat ?? defaultTickFormatSpecifier
    );

    this.derivedProps = {
      showAxisLines,
      xTickCount,
      yTickCount,
      xTicks,
      yTicks,
      xTickFormat,
      yTickFormat,
      xScale: this.props.xScale.copy(),
      yScale: this.props.yScale.copy(),
    };
    return this.derivedProps;
  }

  getDerivedProps() {
    if (!this.derivedProps) {
      throw new Error("layout() hasn't been called yet");
    }
    return this.derivedProps;
  }

  layout(context: CanvasRenderingContext2D, recommendedSize: Dimensions) {
    const derivedProps = this.computeDerivedProps(recommendedSize);

    let leftPadding = 0,
      bottomPadding = 0;

    // update padding to fit things outside of the main cartesian frame
    // measure x tick sizes for dynamic padding
    if (this.props.showYAxis) {
      derivedProps.yTicks.forEach((d) => {
        const measured = context.measureText(derivedProps.yTickFormat(d));
        leftPadding = Math.max(
          leftPadding,
          measured.actualBoundingBoxLeft +
            measured.actualBoundingBoxRight +
            yLabelOffset
        );
      });
    }

    if (this.props.showXAxis) {
      bottomPadding = 20; // TODO - measure
    }

    this.props.child.x = this.x + leftPadding;
    this.props.child.y = this.y;
    this.props.child.layout(context, {
      width: recommendedSize.width - leftPadding,
      height: recommendedSize.height - bottomPadding,
    });
    this.width = this.props.child.width + leftPadding;
    this.height = this.props.child.height + bottomPadding;
  }

  draw(context: CanvasRenderingContext2D) {
    this.props.child.draw(context);

    const tickSize = 2;

    const {
      xTicks,
      xTickFormat,
      yTicks,
      yTickFormat,
      showAxisLines,
      xScale,
      yScale,
    } = this.getDerivedProps();

    // FIXME - mutates props
    xScale.range([this.x, this.x + this.width]);
    yScale.range([this.y + this.height, this.y]);

    // x axis
    if (this.props.showXAxis) {
      context.save();

      if (this.props.showAxisLines) {
        context.beginPath();
        context.strokeStyle = axisColor;
        context.lineWidth = 1;
        context.moveTo(this.x, this.props.yScale(0));
        context.lineTo(this.x + this.width, this.props.yScale(0));
        context.stroke();
      }

      context.fillStyle = labelColor;
      context.font = labelFont;

      let prevBoundary = this.x;
      const y = yScale(0);
      for (let i = 0; i < xTicks.length; i++) {
        const xTick = xTicks[i];
        const x = xScale(xTick);

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
        let startX: number;
        if (i === 0) {
          startX = Math.max(x - textWidth / 2, prevBoundary);
        } else if (i === xTicks.length - 1) {
          startX = Math.min(x - textWidth / 2, this.x + this.width - textWidth);
        } else {
          startX = x - textWidth / 2;
        }
        if (startX < prevBoundary) {
          continue; // doesn't fit, skip
        }

        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillText(text, startX, y + xLabelOffset);

        prevBoundary = startX + textWidth;
      }

      context.restore();
    }

    // y axis
    if (this.props.showYAxis) {
      context.save();

      if (showAxisLines) {
        context.beginPath();
        context.strokeStyle = axisColor;
        context.lineWidth = 1;
        context.moveTo(this.x, this.y);
        context.lineTo(this.x, this.y + this.height);
        context.stroke();
      }

      let prevBoundary = this.y + this.height;
      for (let i = 0; i < yTicks.length; i++) {
        const yTick = yTicks[i];
        context.beginPath();
        const y = yScale(yTick);

        const text = yTickFormat(yTick);
        context.textBaseline = "bottom";
        const { actualBoundingBoxAscent: textHeight } =
          context.measureText(text);

        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(this.x, y);
        context.lineTo(this.x - tickSize, y);
        context.stroke();

        let startY = 0;
        if (i === 0) {
          startY = Math.min(y + textHeight / 2, prevBoundary);
        } else if (i === yTicks.length - 1) {
          startY = Math.max(y + textHeight / 2, this.y + textHeight);
        } else {
          startY = y + textHeight / 2;
        }

        if (startY < prevBoundary) {
          continue; // doesn't fit, skip
        }

        context.textAlign = "right";
        context.textBaseline = "bottom";
        context.fillStyle = labelColor;
        context.font = labelFont;
        context.fillText(text, this.x - yLabelOffset, startY - 1);
        prevBoundary = startY + textHeight;
      }

      context.restore();
    }
  }
}
