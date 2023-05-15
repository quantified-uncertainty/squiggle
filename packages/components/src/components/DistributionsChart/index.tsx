import { clsx } from "clsx";
import * as d3 from "d3";
import isEqual from "lodash/isEqual.js";
import * as React from "react";
import { FC, useCallback, useState } from "react";

import {
  Env,
  resultMap,
  SqDistributionsPlot,
  SqDistributionTag,
  SqShape,
} from "@quri/squiggle-lang";
import { MouseTooltip } from "@quri/ui";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import {
  distance,
  drawAxes,
  drawCircle,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { flattenResult, sqScaleToD3 } from "../../lib/utility.js";
import { ErrorAlert } from "../Alert.js";
import { SummaryTable } from "./SummaryTable.js";

import { Point } from "../../lib/draw/types.js";
import { DrawContext } from "../../lib/hooks/useCanvas.js";

export type DistributionsChartProps = {
  plot: SqDistributionsPlot;
  environment: Env;
  height: number;
};

const InnerDistributionsChart: FC<{
  isMulti: boolean; // enables legend and semi-transparent rendering
  shapes: (SqShape & { name: string })[];
  samples: number[];
  height: number;
  plot: SqDistributionsPlot;
}> = ({ shapes, samples, plot, height: innerHeight, isMulti }) => {
  const [discreteTooltip, setDiscreteTooltip] = useState<
    { value: number; probability: number } | undefined
  >();

  const domain = shapes.flatMap((shape) =>
    shape.discrete.concat(shape.continuous)
  );

  const legendItemHeight = 16;
  const sampleBarHeight = 5;

  const showTitle = !!plot.title;
  const titleHeight = showTitle ? 20 : 4;
  const legendHeight = isMulti ? legendItemHeight * shapes.length : 0;
  const samplesFooterHeight = samples.length ? 10 : 0;

  const height =
    innerHeight + legendHeight + titleHeight + samplesFooterHeight + 30;

  const { cursor, initCursor } = useCanvasCursor();

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const getColor = (i: number) =>
        isMulti ? d3.schemeCategory10[i] : "#5ba3cf";

      const xScale = sqScaleToD3(plot.xScale);
      xScale.domain([
        Number.isFinite(plot.xScale.min)
          ? plot.xScale.min!
          : d3.min(domain, (d) => d.x) ?? 0,
        Number.isFinite(plot.xScale.max)
          ? plot.xScale.max!
          : d3.max(domain, (d) => d.x) ?? 0,
      ]);

      const yScale = sqScaleToD3(plot.yScale);
      // TODO - use yScale.min/max?
      yScale.domain([
        Math.min(...domain.map((p) => p.y), 0), // min value, but at least 0
        Math.max(...domain.map((p) => p.y)),
      ]);

      const { padding, frame } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: {
          left: 10,
          right: 10,
          top: 10 + legendHeight + titleHeight,
          bottom: 20 + samplesFooterHeight,
        },
        xScale,
        yScale,
        hideYAxis: true,
        drawTicks: true,
        tickCount: 10,
        xTickFormat: plot.xScale.tickFormat,
      });

      if (plot.title) {
        context.save();
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillStyle = "black";
        context.font = "bold 12px sans-serif";
        context.fillText(plot.title, width / 2, 4);
        context.restore();
      }

      if (isMulti) {
        const radius = 5;
        for (let i = 0; i < shapes.length; i++) {
          context.save();
          context.translate(padding.left, titleHeight + legendItemHeight * i);
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
        frame.enter();
        const translatedCursor: Point | undefined = cursor
          ? frame.translatedPoint(cursor)
          : undefined;
        const discreteRadius = 5;

        // there can be only one
        let newDiscreteTooltip: typeof discreteTooltip = undefined;

        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];

          // continuous
          context.globalAlpha = isMulti ? 0.3 : 1;
          context.fillStyle = getColor(i);
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
        if (!isEqual(discreteTooltip, newDiscreteTooltip)) {
          setDiscreteTooltip(newDiscreteTooltip);
        }
        frame.exit();
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

      if (
        cursor &&
        cursor.x >= padding.left &&
        cursor.y - padding.left <= frame.width
      ) {
        drawCursorLines({
          frame,
          cursor,
          x: {
            scale: xScale,
            format: d3.format(",.4r"),
          },
        });
      }
    },
    [
      height,
      legendHeight,
      titleHeight,
      samplesFooterHeight,
      shapes,
      samples,
      domain,
      plot,
      discreteTooltip,
      cursor,
      isMulti,
    ]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <MouseTooltip
      isOpen={!!discreteTooltip}
      render={() => (
        <div
          className={clsx(
            "bg-white border border-gray-300 rounded text-xs p-2 grid gap-x-2",
            "squiggle" // tooltip is rendered in a portal, so we need this because squiggle-components styles depend on it
          )}
          style={{
            gridTemplateColumns: "min-content min-content",
          }}
        >
          <div className="text-gray-500 text-right">Value:</div>
          <div>{d3.format(",.6r")(discreteTooltip!.value)}</div>
          <div className="text-gray-500 text-right">Probability:</div>
          <div>{d3.format(",.6r")(discreteTooltip!.probability)}</div>
          <br />
        </div>
      )}
    >
      <canvas
        data-testid="multi-distribution-chart"
        className="w-full"
        ref={ref}
      >
        Distribution plot
      </canvas>
    </MouseTooltip>
  );
};

export const DistributionsChart: FC<DistributionsChartProps> = ({
  plot,
  environment,
  height,
}) => {
  const distributions = plot.distributions;

  const isMulti =
    distributions.length > 1 ||
    !!(distributions.length === 1 && distributions[0].name);

  const shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name ?? x.distribution.toString(),
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
      samples.push(...distribution.getSamples());
    }
  }

  return (
    <div className="flex flex-col items-stretch">
      {plot.xScale.tag === "log" && shapes.value.some(hasMassBelowZero) ? (
        <ErrorAlert heading="Log Domain Error">
          Cannot graph distribution with negative values on logarithmic scale.
        </ErrorAlert>
      ) : (
        <InnerDistributionsChart
          isMulti={isMulti}
          samples={samples}
          shapes={shapes.value}
          plot={plot}
          height={height}
        />
      )}
      <div className="flex justify-center">
        {plot.showSummary && (
          <SummaryTable plot={plot} environment={environment} />
        )}
      </div>
    </div>
  );
};
