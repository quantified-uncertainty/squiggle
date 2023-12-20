import clsx from "clsx";
import * as d3 from "d3";
import isEqual from "lodash/isEqual.js";
import { FC, useCallback, useMemo, useState } from "react";

import {
  Env,
  result,
  resultMap,
  SqDistributionError,
  SqDistributionsPlot,
  SqDistributionTag,
  SqShape,
} from "@quri/squiggle-lang";
import { MouseTooltip, TextTooltip } from "@quri/ui";

import { ErrorAlert } from "../../components/Alert.js";
import { sqScaleToD3 } from "../../lib/d3/index.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import {
  distance,
  distributionColor,
  drawAxes,
  drawCircle,
  drawCursorLines,
  drawVerticalLine,
} from "../../lib/draw/index.js";
import { Point } from "../../lib/draw/types.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { DrawContext } from "../../lib/hooks/useCanvas.js";
import {
  adjustColorBrightness,
  canvasClasses,
  flattenResult,
} from "../../lib/utility.js";
import { PlotTitle } from "../PlotWidget/PlotTitle.js";
import { DistProvider, useVerticalLineValue } from "./DistProvider.js";
import { SummaryTable } from "./SummaryTable.js";
import { adjustPdfHeightToScale } from "./utils.js";

export type DistributionsChartProps = {
  plot: SqDistributionsPlot;
  environment: Env;
  height: number;
};

/**
 * Interpolates to find the y-coordinate at a given x-value.
 * @param xValue The x-value to interpolate at.
 * @param continuousData The array of data points.
 * @param xScale The D3 scale function for the x-axis.
 * @param yScale The D3 scale function for the y-axis.
 * @returns The interpolated y-coordinate on the canvas, or null if interpolation is not possible.
 */
interface DataPoint {
  x: number;
  y: number;
}
function interpolateYAtX(
  xValue: number,
  continuousData: DataPoint[],
  xScale: d3.ScaleContinuousNumeric<number, number>,
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

const InnerDistributionsChart: FC<{
  shapes: (SqShape & {
    name: string;
    p5: result<number, SqDistributionError>;
    p50: result<number, SqDistributionError>;
    p95: result<number, SqDistributionError>;
  })[];
  samples: number[];
  plot: SqDistributionsPlot;
  height: number;
  isMulti: boolean; // enables legend and semi-transparent rendering
  showSamplesBar: boolean;
}> = ({
  shapes: unAdjustedShapes,
  samples,
  plot,
  height: innerHeight,
  isMulti,
  showSamplesBar,
}) => {
  const verticalLine = useVerticalLineValue();

  const [discreteTooltip, setDiscreteTooltip] = useState<
    { value: number; probability: number } | undefined
  >();

  const shapes = unAdjustedShapes.map(
    ({ name, continuous, discrete, p5, p50, p95 }) => ({
      name,
      p5,
      p50,
      p95,
      ...adjustPdfHeightToScale({ discrete, continuous }, plot.xScale),
    })
  );

  const domain = shapes.flatMap((shape) =>
    shape.discrete.concat(shape.continuous)
  );

  const legendItemHeight = 16;

  const legendHeight = isMulti ? legendItemHeight * shapes.length : 0;
  const _showSamplesBar = showSamplesBar && samples.length && !isMulti;
  const samplesFooterHeight = _showSamplesBar ? 10 : 0;

  const height = innerHeight + legendHeight + samplesFooterHeight + 34;
  const sampleBarHeight = Math.min(7, innerHeight * 0.2);

  const { xScale, yScale } = useMemo(() => {
    const xScale = sqScaleToD3(plot.xScale);

    const ensureFinite = (x: number | undefined) =>
      Number.isFinite(x) ? x : undefined;
    xScale.domain([
      ensureFinite(plot.xScale.min) ?? d3.min(domain, (d) => d.x) ?? 0,
      ensureFinite(plot.xScale.max) ?? d3.max(domain, (d) => d.x) ?? 0,
    ]);

    const yScale = sqScaleToD3(plot.yScale);
    yScale.domain([
      Math.min(...domain.map((p) => p.y), 0), // min value, but at least 0
      Math.max(...domain.map((p) => p.y)),
    ]);

    return { xScale, yScale };
  }, [domain, plot.xScale, plot.yScale]);

  const { cursor, initCursor } = useCanvasCursor();

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const getColor = (i: number) =>
        isMulti ? d3.schemeCategory10[i] : distributionColor;

      const { padding, frame } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: {
          left: 10,
          right: 10,
          top: 10 + legendHeight,
          bottom: 20 + samplesFooterHeight,
        },
        xScale,
        yScale,
        hideYAxis: true,
        drawTicks: false,
        xTickFormat: plot.xScale.tickFormat,
        xAxisTitle: plot.xScale.title,
        hideAxisLines: true,
      });

      if (isMulti) {
        const radius = 5;
        for (let i = 0; i < shapes.length; i++) {
          context.save();
          context.translate(padding.left, legendItemHeight * i);
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
      function lightenColor(color, percent) {
        // let col = d3.rgb(color);
        return d3.interpolateLab(color, "#fff")(percent); // use interpolateLab to convert to Lab and lighten
        // col
        // col = col.brighter(percent); // using darker with negative value to lighten
        // return col.toString();
      }

      const gradient = context.createLinearGradient(
        0,
        0,
        width * 0.6,
        height * 0.6
      );
      gradient.addColorStop(0, "#6d9bce"); // Start color
      gradient.addColorStop(1, "#4fabce"); // End color
      const lightenedGradient = context.createLinearGradient(
        0,
        0,
        width * 0.6,
        height * 0.6
      );
      const brighter = 0.75;
      lightenedGradient.addColorStop(0, lightenColor("#6d9bce", brighter)); // Start color
      lightenedGradient.addColorStop(1, lightenColor("#4fabce", brighter)); // End color
      // samples
      if (_showSamplesBar) {
        context.save();
        context.strokeStyle = gradient;
        context.globalAlpha = 0.7;

        context.lineWidth = 0.5;

        samples.forEach((sample) => {
          context.beginPath();
          const x = xScale(sample);

          context.beginPath();
          context.moveTo(padding.left + x, height - sampleBarHeight - 30);
          context.lineTo(padding.left + x, height - 30);
          context.stroke();
        });
        context.restore();
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
          context.fillStyle = lightenedGradient; // getColor(i);
          context.beginPath();
          d3
            .area<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y0((d) => yScale(d.y))
            .y1(0)
            .context(context)(shape.continuous);
          context.fill();

          for (const percentile of [shape.p5, shape.p50, shape.p95]) {
            if (percentile.ok) {
              const xPoint = percentile.value;
              const interpolateY = interpolateYAtX(
                xPoint,
                shape.continuous,
                xScale,
                yScale
              );
              if (interpolateY) {
                context.beginPath();
                context.strokeStyle = gradient;
                context.globalAlpha = 0.3;
                context.lineWidth = 1;
                context.moveTo(xScale(xPoint), 0);
                context.lineTo(xScale(xPoint), interpolateY);
                context.stroke();
              }
            }
          }

          // The top line
          context.globalAlpha = 0.8;
          context.strokeStyle = gradient;
          context.beginPath();
          d3
            .line<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .context(context)(shape.continuous);
          context.stroke();

          // discrete
          const darkenAmountCircle = isMulti ? 10 : 50;
          const darkenAmountLine = Math.floor(darkenAmountCircle / 2);

          const discreteLineColor = adjustColorBrightness(
            getColor(i),
            -darkenAmountLine
          );
          const discreteCircleColor = adjustColorBrightness(
            getColor(i),
            -darkenAmountCircle
          );

          context.strokeStyle = discreteLineColor;
          context.fillStyle = discreteCircleColor;
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

      drawCursorLines({
        frame,
        cursor,
        x: {
          scale: xScale,
          format: plot.xScale.tickFormat,
        },
      });

      if (verticalLine) {
        drawVerticalLine({
          frame,
          scale: xScale,
          format: plot.xScale.tickFormat,
          x: xScale(verticalLine),
        });
      }
    },
    [
      height,
      legendHeight,
      samplesFooterHeight,
      shapes,
      samples,
      plot,
      discreteTooltip,
      cursor,
      isMulti,
      _showSamplesBar,
      xScale,
      yScale,
      verticalLine,
      sampleBarHeight,
    ]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <MouseTooltip
      isOpen={!!discreteTooltip}
      render={() =>
        discreteTooltip ? (
          <div
            className={clsx(
              "bg-white border border-gray-300 rounded text-xs p-2 grid gap-x-2"
            )}
            style={{
              gridTemplateColumns: "min-content min-content",
            }}
          >
            <div className="text-gray-500 text-right">Value:</div>
            <div>
              {xScale.tickFormat(
                undefined,
                plot.xScale.tickFormat
              )(discreteTooltip.value)}
            </div>
            <div className="text-gray-500 text-right">Probability:</div>
            <div>
              {yScale.tickFormat(
                undefined,
                plot.yScale.tickFormat
              )(discreteTooltip.probability)}
            </div>
            <br />
          </div>
        ) : null
      }
    >
      <canvas
        data-testid="multi-distribution-chart"
        className={canvasClasses}
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
  const CUTOFF_TO_SHOW_SAMPLES_BAR = 100000; // Default to stop showing bottom samples bar if there are more than 100k samples
  const HEIGHT_SAMPLES_BAR_CUTOFF = 30; // Default to stop showing bottom samples bar if the height is less than 50px
  const distributions = plot.distributions;

  // Collect samples to render them in a sample bar.
  const samples: number[] = useMemo(() => {
    const samplesToConcat: (readonly number[])[] = [];
    for (const { distribution } of distributions) {
      if (distribution.tag === SqDistributionTag.SampleSet) {
        // It's important not to use the ...spread operator on samples, so that it works with >1M samples.
        // (JS would fail with "Too many arguments" otherwise).
        samplesToConcat.push(distribution.getSamples());
      }
    }
    return ([] as number[]).concat(...samplesToConcat);
  }, [distributions]);

  const shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name ?? x.distribution.toString(),
        p5: x.distribution.inv(environment, 0.05),
        p50: x.distribution.inv(environment, 0.5),
        p95: x.distribution.inv(environment, 0.95),
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

  const normalizedStatus = distributions.map(({ name, distribution }) => ({
    name,
    isNormalized: distribution.isNormalized(),
  }));

  const anyAreNonnormalized = normalizedStatus.some(
    ({ isNormalized }) => !isNormalized
  );

  const nonNormalizedError = () => {
    const message =
      distributions.length === 1
        ? `Not a valid probability distribution. Its integral is ${distributions[0].distribution.integralSum()}, it should be 1. Squiggle currently poorly supports these types.`
        : `Distributions: [${normalizedStatus
            .filter(({ isNormalized }) => !isNormalized)
            .map(({ name }) => name)
            .join(
              ", "
            )}] are not valid probability distributions, because their integrals do not add up to 1.`;
    return (
      <div>
        <TextTooltip text={message} placement="top">
          <div className="font-semibold text-xs text-orange-900 bg-orange-100 rounded-md px-1.5 py-0.5 w-fit ml-2">
            Not Normalized
          </div>
        </TextTooltip>
      </div>
    );
  };

  const showSamplesBar =
    samples.length < CUTOFF_TO_SHOW_SAMPLES_BAR &&
    height > HEIGHT_SAMPLES_BAR_CUTOFF;

  const isMulti =
    distributions.length > 1 ||
    !!(distributions.length === 1 && distributions[0].name);

  return (
    <DistProvider generateInitialValue={() => ({})}>
      <div className="flex flex-col items-stretch">
        {plot.title && <PlotTitle title={plot.title} />}
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
            height={height * 0.5}
            showSamplesBar={showSamplesBar}
          />
        )}
        {!anyAreNonnormalized && plot.showSummary && (
          <div className="flex pt-1 mt-2 overflow-auto">
            <div className=" overflow-auto ml-auto">
              <SummaryTable plot={plot} environment={environment} />
            </div>
          </div>
        )}
        {anyAreNonnormalized && nonNormalizedError()}
      </div>
    </DistProvider>
  );
};
