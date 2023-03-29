import * as d3 from "d3";
import * as React from "react";
import { FC, useEffect, useState } from "react";
import { useMeasure } from "react-use";
import * as yup from "yup";

import {
  Env,
  resultMap,
  SqDistributionTag,
  SqShape,
} from "@quri/squiggle-lang";
import { SqDistributionsPlot } from "@quri/squiggle-lang/src/public/SqPlot";

import { hasMassBelowZero } from "../../lib/distributionUtils";
import { useCanvas, useCanvasCursor } from "../../lib/hooks";
import { flattenResult } from "../../lib/utility";
import { ErrorAlert } from "../Alert";
import {
  drawAxes,
  drawCircle,
  drawVerticalCursorLine,
  primaryColor,
} from "../../lib/drawUtils";
import { SummaryTable } from "./SummaryTable";
import { Plot } from "./types";
import {
  useFloating,
  useClientPoint,
  useInteractions,
  FloatingPortal,
  offset,
  shift,
} from "@floating-ui/react";
import _ from "lodash";

export const distributionSettingsSchema = yup.object({}).shape({
  /** Set the x scale to be logarithmic */
  logX: yup.boolean().required().default(false),
  /** Set the y scale to be exponential */
  expY: yup.boolean().required().default(false),
  minX: yup.number(),
  maxX: yup.number(),
  title: yup.string(),
  xAxisType: yup
    .mixed<"number" | "dateTime">()
    .oneOf(["number", "dateTime"])
    .default("number"),
  /** Documented here: https://github.com/d3/d3-format */
  tickFormat: yup.string().required().default(".9~s"),
  showSummary: yup.boolean().required().default(false),
});

export type DistributionChartSettings = yup.InferType<
  typeof distributionSettingsSchema
>;

export function sqPlotToPlot(sqPlot: SqDistributionsPlot): Plot {
  return {
    distributions: sqPlot.distributions.map((x) => ({ ...x, opacity: 0.3 })),
    colorScheme: "category10",
    showLegend: true,
  };
}

export type MultiDistributionChartProps = {
  plot: Plot;
  environment: Env;
  height: number;
  settings: DistributionChartSettings;
};

type Point = {
  x: number;
  y: number;
};

function distance(point1: Point, point2: Point) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

const InnerMultiDistributionChart: FC<{
  shapes: (SqShape & { name: string; opacity: number })[];
  samples: number[];
  settings: DistributionChartSettings;
  height: number;
  width: number;
  plot: Plot;
}> = ({ shapes, samples, plot, height, settings, width }) => {
  const [discreteTooltip, setDiscreteTooltip] = useState<
    { value: number; probability: number } | undefined
  >();

  const isTooltipOpen = !!discreteTooltip;
  const floating = useFloating({
    open: isTooltipOpen,
    middleware: [offset(4), shift()],
  });

  const floatingClientPoint = useClientPoint(floating.context);

  const floatingInteractions = useInteractions([floatingClientPoint]);

  const domain = shapes.flatMap((shape) =>
    shape.discrete.concat(shape.continuous)
  );

  const { ref, refChanged, context } = useCanvas({ width, height });

  const cursor = useCanvasCursor({ refChanged, context });

  useEffect(() => {
    if (!context) {
      return;
    }
    context.clearRect(0, 0, width, height);

    const getColor = (i: number) =>
      plot.colorScheme === "blues" ? "#5ba3cf" : d3.schemeCategory10[i];

    const legendItemHeight = 16;
    const sampleBarHeight = 5;

    const { padding, chartWidth, chartHeight, xScale, yScale } = drawAxes({
      suggestedPadding: {
        left: 10,
        right: 10,
        top: 10 + (plot.showLegend ? legendItemHeight * shapes.length : 0),
        bottom: 20 + (samples.length ? 10 : 0),
      },
      xDomain: d3.extent(domain, (d) => d.x) as [number, number],
      yDomain: [
        Math.min(...domain.map((p) => p.y), 0), // min value, but at least 0
        Math.max(...domain.map((p) => p.y)),
      ],
      width,
      height,
      context,
      hideYAxis: true,
      drawTicks: true,
      logX: settings.logX,
      expY: settings.expY,
      tickCount: 10,
    });

    if (plot.showLegend) {
      const radius = 5;
      for (let i = 0; i < shapes.length; i++) {
        context.save();
        context.translate(padding.left, 5 + legendItemHeight * i);
        context.fillStyle = getColor(i);
        drawCircle({
          context,
          x: radius,
          y: radius,
          r: radius,
        });

        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = "black";
        context.font = "12px sans-serif";
        context.fillText(shapes[i].name, 16, radius);
        context.restore();
      }
    }

    // shapes
    {
      context.save();
      context.translate(padding.left, chartHeight + padding.top);
      context.scale(1, -1);
      const translatedCursor: Point | undefined = cursor
        ? {
            x: cursor[0] - padding.left,
            y: padding.top + chartHeight - cursor[1],
          }
        : undefined;
      const discreteRadius = 5;

      // there can be only one
      let newDiscreteTooltip: typeof discreteTooltip = undefined;

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];

        // continuous
        context.globalAlpha = shape.opacity;
        context.fillStyle =
          plot.colorScheme === "blues" ? "#5ba3cf" : d3.schemeCategory10[i];
        context.beginPath();
        d3
          .area<SqShape["continuous"][number]>()
          .x((d) => xScale(d.x))
          .y0((d) => yScale(d.y))
          .y1(0)
          .context(context)(shape.continuous);
        context.fill();

        context.globalAlpha = 1;
        context.strokeStyle = context.fillStyle;
        d3
          .line<SqShape["continuous"][number]>()
          .x((d) => xScale(d.x))
          .y((d) => yScale(d.y))
          .context(context)(shape.continuous);
        context.stroke();

        // discrete
        for (const point of shape.discrete) {
          context.beginPath();
          context.lineWidth = 1;
          const x = xScale(point.x);
          const y = yScale(point.y);
          if (
            translatedCursor &&
            distance({ x, y }, translatedCursor) <= discreteRadius
          ) {
            // the last discrete point always wins over overlapping previous points
            // this makes sense because it's drawn last
            newDiscreteTooltip = { value: point.x, probability: point.y };
          }
          context.moveTo(x, 0);
          context.lineTo(x, y);
          context.stroke();
          drawCircle({ context, x, y, r: discreteRadius });
        }
      }
      context.restore();
      if (!_.isEqual(discreteTooltip, newDiscreteTooltip)) {
        setDiscreteTooltip(newDiscreteTooltip);
      }
    }

    // samples
    context.save();
    context.strokeStyle = primaryColor;
    context.lineWidth = 0.1;
    samples.forEach((sample) => {
      context.beginPath();
      const x = xScale(sample);

      context.beginPath();
      context.moveTo(padding.left + x, height - sampleBarHeight);
      context.lineTo(padding.left + x, height);
      context.stroke();
    });
    context.restore();

    // hover vertical line & position preview
    if (
      cursor &&
      cursor[0] >= padding.left &&
      cursor[0] - padding.left <= chartWidth
    ) {
      drawVerticalCursorLine({
        cursor,
        padding,
        chartWidth,
        chartHeight,
        xScale,
        tickFormat: d3.format(",.4r"),
        context,
      });
    }
  }, [
    context,
    width,
    height,
    shapes,
    samples,
    domain,
    plot.colorScheme,
    plot.showLegend,
    discreteTooltip,
    cursor,
    settings.logX,
    settings.expY,
  ]);

  return (
    <div
      ref={floating.refs.setReference}
      {...floatingInteractions.getReferenceProps()}
    >
      <canvas ref={ref}>Distribution plot</canvas>
      {isTooltipOpen && (
        <FloatingPortal>
          <div
            ref={floating.refs.setFloating}
            style={{
              position: floating.strategy,
              top: floating.y ?? 0,
              left: floating.x ?? 0,
            }}
            className="squiggle"
            {...floatingInteractions.getFloatingProps()}
          >
            <div
              className="bg-white border border-gray-300 rounded text-xs p-2 grid gap-x-2"
              style={{
                gridTemplateColumns: "min-content min-content",
              }}
            >
              <div className="text-gray-500 text-right">Value:</div>
              <div>{d3.format(",.6r")(discreteTooltip.value)}</div>
              <div className="text-gray-500 text-right">Probability:</div>
              <div>{d3.format(",.6r")(discreteTooltip.probability)}</div>
              <br />
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
};

export const MultiDistributionChart: FC<MultiDistributionChartProps> = ({
  plot,
  environment,
  settings,
  height,
}) => {
  const [containerRef, containerMeasure] = useMeasure<HTMLDivElement>();

  const distributions = plot.distributions;

  const shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name,
        opacity: x.opacity,
        ...pointSet.asShape(),
      }))
    )
  );

  if (!shapes.ok) {
    return (
      <ErrorAlert heading="Distribution Error">
        {shapes.value.toString()}
      </ErrorAlert>
    );
  }

  // if this is a sample set, include the samples
  const samples: number[] = [];
  for (const { distribution } of distributions) {
    if (distribution.tag === SqDistributionTag.SampleSet) {
      samples.push(...distribution.value().samples);
    }
  }

  return (
    <div ref={containerRef}>
      {settings.logX && shapes.value.some(hasMassBelowZero) ? (
        <ErrorAlert heading="Log Domain Error">
          Cannot graph distribution with negative values on logarithmic scale.
        </ErrorAlert>
      ) : (
        <figure>
          {
            containerMeasure.width ? (
              <InnerMultiDistributionChart
                samples={samples}
                shapes={shapes.value}
                plot={plot}
                settings={settings}
                height={height}
                width={containerMeasure.width}
              />
            ) : null /* width can be 0 initially or when we're on the server side; that's fine, we don't want to pre-render charts with broken width */
          }{" "}
        </figure>
      )}
      <div className="flex justify-center">
        {settings.showSummary && (
          <SummaryTable plot={plot} environment={environment} />
        )}
      </div>
    </div>
  );
};
