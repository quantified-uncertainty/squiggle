import * as d3 from "d3";
import { Align, Edge, FlexDirection, PositionType } from "yoga-layout";

import { defaultTickFormatSpecifier } from "../d3/patchedScales.js";
import { AnyNumericScale } from "./AxesBox.js";
import { CanvasElement, CC, makeNode } from "./CanvasElement.js";
import { contextWidthHeight } from "./CanvasFrame.js";
import { MainChartHandle } from "./MainChart.js";
import { axisColor, labelColor, labelFont } from "./styles.js";
import { drawElement, getLocalPoint, measureText } from "./utils.js";

const xLabelOffset = 6;
const yLabelOffset = 6;

const tickSize = 2;

export const tickCountInterpolator = d3
  .scaleLinear()
  .domain([40, 1000]) // The potential width*height of the chart
  .range([3, 16]) // The range of circle radiuses
  .clamp(true);

type AxisProps = {
  scale: AnyNumericScale;
  tickCount: number;
  tickFormat: (x: number) => string;
  show: boolean;
  showLine: boolean;
};

const YAxis: CC<AxisProps> = ({
  scale,
  tickCount,
  tickFormat,
  show,
  showLine,
}) => {
  const node = makeNode();

  const ticks = scale.ticks(tickCount);

  // measure x tick sizes for content-driven size
  let width = 0;
  ticks.forEach((d) => {
    const measured = measureText({
      text: tickFormat(d),
      font: labelFont,
    });
    width = Math.max(
      width,
      measured.actualBoundingBoxLeft +
        measured.actualBoundingBoxRight +
        yLabelOffset
    );
  });
  node.setWidth(width);

  return {
    node,
    draw: (context, layout) => {
      if (!show) {
        return;
      }

      const usedScale = scale.copy().range([layout.height, 0]);

      if (showLine) {
        context.beginPath();
        context.strokeStyle = axisColor;
        context.lineWidth = 1;
        context.moveTo(layout.width, 0);
        context.lineTo(layout.width, layout.height);
        context.stroke();
      }

      // Bottom boundary for text label that shouldn't be exceeded, to avoid overlapping text issues.
      // TODO - allow more (overflow outside of node boundaries) if the canvas is big enough.
      let prevBoundary = layout.height;

      for (let i = 0; i < ticks.length; i++) {
        const yTick = ticks[i];
        context.beginPath();
        const y = usedScale(yTick);

        const text = tickFormat(yTick);
        context.textBaseline = "bottom";
        const { actualBoundingBoxAscent } = context.measureText(text);

        const textHeight = actualBoundingBoxAscent;

        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(layout.width, y);
        context.lineTo(layout.width - tickSize, y);
        context.stroke();

        let startY = layout.height;
        if (i === ticks.length - 1) {
          startY = Math.max(y + textHeight / 2, textHeight);
        } else {
          startY = y + textHeight / 2;
        }

        if (startY > prevBoundary) {
          continue; // doesn't fit, skip
        }

        context.textAlign = "right";
        context.textBaseline = "bottom";
        context.fillStyle = labelColor;
        context.font = labelFont;
        context.fillText(text, layout.width - yLabelOffset, startY + 1); // with +1, text looks more centered
        prevBoundary = startY - textHeight;
      }
    },
  };
};

const XAxis: CC<AxisProps> = ({
  scale,
  tickCount,
  tickFormat,
  show,
  showLine,
}) => {
  const node = makeNode();
  if (show) {
    // TODO - measure
    node.setHeight(20);
  }

  return {
    node,
    draw(context, layout) {
      // x axis
      if (!show) {
        return;
      }

      const usedScale = scale.copy().range([0, layout.width]);
      const ticks = usedScale.ticks(tickCount);

      if (showLine) {
        context.beginPath();
        context.strokeStyle = axisColor;
        context.lineWidth = 1;
        context.moveTo(0, 0);
        context.lineTo(layout.width, 0);
        context.stroke();
      }
      context.fillStyle = labelColor;
      context.font = labelFont;

      // Allow overflow outside of node boundaries if there's space on canvas
      let prevBoundary = Math.max(
        -node.getComputedLeft(),
        getLocalPoint(context, { x: 0, y: 0 }).x
      );

      for (let i = 0; i < ticks.length; i++) {
        const xTick = ticks[i];
        const x = usedScale(xTick);
        context.beginPath();
        context.strokeStyle = labelColor;
        context.lineWidth = 1;
        context.moveTo(x, 0);
        context.lineTo(x, tickSize);
        context.stroke();
        const text = tickFormat(xTick);
        if (text === "") {
          continue; // we're probably rendering scaleLog, which has empty labels
        }
        const { width: textWidth } = context.measureText(text);
        let startX: number;
        if (i === 0) {
          startX = Math.max(x - textWidth / 2, prevBoundary);
        } else if (i === ticks.length - 1) {
          startX = Math.min(
            x - textWidth / 2,
            getLocalPoint(context, {
              x: contextWidthHeight(context).width,
              y: 0,
            }).x - textWidth
          );
        } else {
          startX = x - textWidth / 2;
        }
        if (startX < prevBoundary) {
          continue; // doesn't fit, skip
        }
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillText(text, startX, xLabelOffset);
        prevBoundary = startX + textWidth;
      }
      context.restore();
    },
  };
};

export const AxesContainer: CC<{
  xScale: AnyNumericScale;
  yScale: AnyNumericScale;
  showXAxis: boolean;
  showYAxis: boolean;
  showAxisLines: boolean;
  xTickCount?: number;
  yTickCount?: number;
  xTickFormat?: string;
  yTickFormat?: string;
  child: CanvasElement<MainChartHandle>;
}> = (props) => {
  /*
   * Axes container is a grid, and yoga doesn't support grids.
   *
   * It'd be quite difficult to layout axes container if the chart height is
   * not known, because x axis width must match the chart width, and we should
   * set it correctly before `getComputedLayout` is called.
   *
   * If we ever need it: maybe incremental layouts could help,
   * https://www.yogalayout.dev/docs/advanced/incremental-layout
   */
  const height = props.child.handle.getHeight();

  const node = makeNode();

  // two columns: first, y axis; then the main chart and x axis positioned on top of it
  node.setFlexDirection(FlexDirection.Row);

  const showAxisLines = props.showAxisLines ?? height > 150;

  const xTickCount = props.xTickCount || tickCountInterpolator(height); // width * height);
  const yTickCount = props.yTickCount || tickCountInterpolator(height); // width * height);

  // y axis column
  let yAxis: CanvasElement | undefined;
  if (props.showYAxis) {
    const yAxis = YAxis({
      scale: props.yScale,
      tickCount: yTickCount,
      tickFormat: props.yScale.tickFormat(
        yTickCount,
        props.yTickFormat ?? defaultTickFormatSpecifier
      ),
      show: props.showYAxis,
      showLine: showAxisLines,
    });

    yAxis.node.setAlignSelf(Align.FlexStart);
    yAxis.node.setHeight(height);
    node.insertChild(yAxis.node, node.getChildCount());
  }

  // main chart column
  const chartAndXAxis = makeNode();
  chartAndXAxis.insertChild(props.child.node, 0);

  const xAxis = XAxis({
    scale: props.xScale,
    tickCount: xTickCount,
    tickFormat: props.xScale.tickFormat(
      xTickCount,
      props.xTickFormat ?? defaultTickFormatSpecifier
    ),
    show: props.showXAxis,
    showLine: showAxisLines,
  });
  chartAndXAxis.insertChild(xAxis.node, 1);

  // X axis can be positioned in the middle of the chart, in case the chart contains negative y values.
  // So we use absolute positioning.
  xAxis.node.setPositionType(PositionType.Absolute);
  const xAxisTop = props.yScale.copy().range([height, 0])(0);
  xAxis.node.setMargin(Edge.All, props.child.handle.getMargin());
  xAxis.node.setPosition(Edge.Left, 0);
  xAxis.node.setPosition(Edge.Right, 0);
  xAxis.node.setPosition(Edge.Top, xAxisTop);
  chartAndXAxis.setMinHeight(xAxisTop + xAxis.node.getHeight().value);

  chartAndXAxis.setFlexGrow(1);
  node.insertChild(chartAndXAxis, node.getChildCount());

  return {
    node,
    draw: (context) => {
      if (yAxis) drawElement(yAxis, context);

      {
        // TODO - extract chartAndXAxis to a reusable CC
        context.save();
        context.translate(
          chartAndXAxis.getComputedLeft(),
          chartAndXAxis.getComputedTop()
        );
        drawElement(props.child, context);
        drawElement(xAxis, context);

        context.restore();
      }
    },
  };
};
