import * as d3 from "d3";
import isEqual from "lodash/isEqual.js";
import Yoga, { Edge, PositionType } from "yoga-layout";

import { result, SqDistributionError, SqShape } from "@quri/squiggle-lang";

import { AnyNumericScale } from "./AxesBox.js";
import { makeNull } from "./AxesTitlesContainer.js";
import { CanvasElement, CC, makeNode } from "./CanvasElement.js";
import { drawCircle } from "./drawCircle.js";
import { CursorGuideLines, VerticalGuideLine } from "./GuideLines.js";
import { distributionColor } from "./styles.js";
import { Point } from "./types.js";
import { distance, drawElement, getLocalPoint } from "./utils.js";

// We have a similar function in squiggle-lang, but it's not exported, and this function is simple enough.
type DataPoint = {
  x: number;
  y: number;
};
function interpolateYAtX(
  xValue: number,
  continuousData: { x: number; y: number }[],
  yScale: d3.ScaleContinuousNumeric<number, number>
): number | null {
  let pointBefore: DataPoint | null = null,
    pointAfter: DataPoint | null = null;
  for (const point of continuousData) {
    if (point.x <= xValue) {
      pointBefore = point;
    } else {
      pointAfter = point;
      break;
    }
  }

  if (pointBefore && pointAfter) {
    const xInterpolate = d3
      .scaleLinear()
      .domain([pointBefore.x, pointAfter.x])
      .range([yScale(pointBefore.y), yScale(pointAfter.y)]);
    return xInterpolate(xValue);
  } else {
    return null;
  }
}

export function getColor(i: number, isMulti: boolean, lightening?: number) {
  const color = isMulti ? d3.schemeCategory10[i] : distributionColor;
  if (lightening) {
    return d3.interpolateLab(color, "#fff")(lightening);
  } else {
    return color;
  }
}

const distRadiusScalingFromHeight = d3
  .scaleLinear()
  .domain([10, 300]) // The potential height of the chart
  .range([2, 5]) // The range of circle radiuses
  .clamp(true);

type Shapes = (SqShape & {
  name: string;
  p5: result<number, SqDistributionError>;
  p50: result<number, SqDistributionError>;
  p95: result<number, SqDistributionError>;
})[];

const LegendItem: CC<{ shape: Shapes[number]; i: number }> = ({ shape, i }) => {
  const legendItemHeight = 16;
  const legendCircleRadius = 5;

  const node = makeNode();
  node.setHeight(legendItemHeight);

  return {
    node,
    draw: (context) => {
      context.fillStyle = getColor(i, true);
      drawCircle({
        context,
        x: legendCircleRadius,
        y: legendCircleRadius,
        r: legendCircleRadius,
      });

      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillStyle = "black";
      context.font = "12px sans-serif";
      context.fillText(shape.name, 16, legendCircleRadius);
    },
  };
};

const Legend: CC<{ shapes: Shapes }> = ({ shapes }) => {
  const node = makeNode();

  const children = shapes.map((shape, i) => {
    const child = LegendItem({ shape, i });
    node.insertChild(child.node, node.getChildCount());
    child.node.setPadding(Edge.Bottom, 2);
    return child;
  });

  return {
    node,
    draw: (context) => {
      for (const child of children) {
        drawElement(child, context);
      }
    },
  };
};

export const MainChart: CC<
  {
    shapes: Shapes;
    isMulti: boolean;
    showPercentileLines: boolean;
    discreteTooltip: { value: number; probability: number } | undefined;
    setDiscreteTooltip: (
      tooltip: { value: number; probability: number } | undefined
    ) => void;
    height: number;
    cursor: Point | undefined;
    xScale: AnyNumericScale;
    yScale: AnyNumericScale;
    xTickFormat?: string; // useful for guidelines
    verticalLine?: number;
  },
  { getMargin: () => number }
> = ({
  shapes,
  isMulti,
  showPercentileLines,
  discreteTooltip,
  setDiscreteTooltip,
  height,
  cursor,
  xScale: _xScale,
  yScale: _yScale,
  xTickFormat,
  verticalLine,
}) => {
  const discreteRadius = distRadiusScalingFromHeight(height);

  const node = makeNode();
  node.setHeight(height);
  node.setMargin(Yoga.EDGE_ALL, discreteRadius);

  const cursorGuideLines = cursor
    ? CursorGuideLines({
        cursor,
        x: {
          scale: _xScale,
          format: xTickFormat,
        },
      })
    : makeNull({});
  node.insertChild(cursorGuideLines.node, node.getChildCount());
  cursorGuideLines.node.setPositionType(PositionType.Absolute);
  cursorGuideLines.node.setPosition(Edge.All, 0);

  const verticalGuideLine =
    verticalLine === undefined
      ? makeNull({})
      : VerticalGuideLine({
          scale: _xScale,
          value: verticalLine,
          mode: "domain",
          format: xTickFormat,
        });
  node.insertChild(verticalGuideLine.node, node.getChildCount());
  verticalGuideLine.node.setPositionType(PositionType.Absolute);
  verticalGuideLine.node.setPosition(Edge.All, 0);

  let legend: CanvasElement | undefined;
  if (isMulti) {
    legend = Legend({ shapes });
    node.insertChild(legend.node, node.getChildCount());
  }

  return {
    node,
    draw: (context, layout) => {
      const xScale = _xScale.copy();
      xScale.range([0, layout.width]);
      const yScale = _yScale.copy();
      yScale.range([layout.height, 0]);

      const translatedCursor: Point | undefined = cursor
        ? getLocalPoint(context, cursor)
        : undefined;

      // shapes
      {
        // there can be only one
        let newDiscreteTooltip: typeof discreteTooltip = undefined;

        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];

          // Continuous fill.
          // In the case of one distribution, we don't want it to be
          // transparent, so that we can show the samples lines. In the case of
          // multiple distributions, we want them to be transparent so that we
          // can see the other distributions.
          context.fillStyle = isMulti
            ? getColor(i, isMulti, 0)
            : getColor(i, isMulti, 0.7);
          context.globalAlpha = isMulti ? 0.4 : 1;
          context.beginPath();
          d3
            .area<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y0((d) => yScale(d.y))
            .y1(yScale(0))
            .context(context)(shape.continuous);
          context.fill();
          context.globalAlpha = 1;

          // Percentile lines
          if (showPercentileLines) {
            const percentiles = [
              [shape.p5, "p5"],
              [shape.p50, "p50"],
              [shape.p95, "p95"],
            ] as const;
            percentiles.forEach(([percentile, name]) => {
              if (!percentile.ok) {
                return;
              }
              const xPoint = percentile.value;

              // We need to find the y value of the percentile in question, to
              // draw the line only up to the top of the distribution. We have
              // to do this with interpolation, which is not provided
              // straightforwardly by d3.
              const interpolateY = interpolateYAtX(
                xPoint,
                shape.continuous,
                yScale
              );
              if (!interpolateY) {
                return;
              }

              context.save();
              context.beginPath();
              context.strokeStyle = getColor(
                i,
                isMulti,
                name === "p50" ? 0.4 : 0.3
              );
              if (name === "p50") {
                context.setLineDash([6, 4]);
              } else {
                context.setLineDash([2, 2]);
              }
              context.lineWidth = 1;
              context.moveTo(xScale(xPoint), yScale(0));
              context.lineTo(xScale(xPoint), interpolateY);
              context.stroke();
              context.restore();
            });
          }

          // The top line
          context.strokeStyle = getColor(i, isMulti);
          context.beginPath();
          d3
            .line<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .context(context)(shape.continuous);
          context.stroke();

          const darkenAmountCircle = isMulti ? 0.05 : 0.1;

          const discreteLineColor = getColor(i, isMulti, -darkenAmountCircle);
          const discreteCircleColor = getColor(i, isMulti, -darkenAmountCircle);

          context.fillStyle = discreteCircleColor;
          context.strokeStyle = discreteLineColor;
          for (const point of shape.discrete) {
            context.beginPath();
            context.lineWidth = 1;
            const x = xScale(point.x);
            // The circle is drawn from the top of the circle, so we need to subtract the radius to get the center of the circle to be at the top of the bar.
            const y = yScale(point.y) - discreteRadius;
            if (
              translatedCursor &&
              distance({ x, y }, translatedCursor) <= discreteRadius + 2
            ) {
              // the last discrete point always wins over overlapping previous points
              // this makes sense because it's drawn last
              newDiscreteTooltip = { value: point.x, probability: point.y };
              //darken the point if it's hovered
              context.fillStyle = getColor(i, isMulti, -1);
              context.strokeStyle = getColor(i, isMulti, -1);
            }
            context.moveTo(x, yScale(0));
            context.lineTo(x, y);
            context.globalAlpha = 0.5; // We want the lines to be transparent - the circles are the main focus
            context.stroke();
            context.globalAlpha = 1;
            drawCircle({
              context,
              x,
              y,
              r: discreteRadius,
            });
          }
        }

        if (!isEqual(discreteTooltip, newDiscreteTooltip)) {
          setDiscreteTooltip(newDiscreteTooltip);
        }
      }

      if (legend) {
        drawElement(legend, context);
      }

      drawElement(cursorGuideLines, context);
      drawElement(verticalGuideLine, context);
    },
    handle: {
      getMargin: () => discreteRadius,
    },
  };
};
