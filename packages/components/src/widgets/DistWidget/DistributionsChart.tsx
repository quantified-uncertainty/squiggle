import clsx from "clsx";
import * as d3 from "d3";
import { FC, useMemo, useState } from "react";
import { Edge, PositionType } from "yoga-layout";

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

import { useViewerType } from "../../components/SquiggleViewer/ViewerProvider.js";
import { ErrorAlert } from "../../components/ui/Alert.js";
import { sqScaleToD3 } from "../../lib/d3/index.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { AnyNumericScale } from "../../lib/draw/AxesBox.js";
import { AxesContainer } from "../../lib/draw/AxesContainer.js";
import { AxesTitlesContainer } from "../../lib/draw/AxesTitlesContainer.js";
import { BarSamples } from "../../lib/draw/BarSamples.js";
import { CanvasElement, CC, makeNode } from "../../lib/draw/CanvasElement.js";
import { MainChart, MainChartHandle } from "../../lib/draw/MainChart.js";
import { ReactCanvas } from "../../lib/draw/ReactCanvas.js";
import { Point } from "../../lib/draw/types.js";
import { drawElement } from "../../lib/draw/utils.js";
import { useCanvasCursor } from "../../lib/hooks/index.js";
import { flattenResult } from "../../lib/utility.js";
import { PlotTitle } from "../PlotWidget/PlotTitle.js";
import { DistProvider, useSelectedVerticalLine } from "./DistProvider.js";
import { SummaryTable } from "./SummaryTable.js";
import { adjustPdfHeightToScale } from "./utils.js";

export type DistributionsChartProps = {
  plot: SqDistributionsPlot;
  environment: Env;
  height: number;
};

type SampleBarSetting = "none" | "bottom" | "behind";
type DiscreteTooltip = { value: number; probability: number };

const MainChartWithBarSamplesBehind: CC<
  {
    mainChart: CanvasElement<MainChartHandle>;
    barSamples: CanvasElement;
  },
  MainChartHandle
> = ({ mainChart, barSamples }) => {
  const node = makeNode();
  node.insertChild(mainChart.node, 0);

  node.insertChild(barSamples.node, 1);
  barSamples.node.setPositionType(PositionType.Absolute);
  barSamples.node.setPosition(Edge.Bottom, mainChart.handle.getMargin());
  barSamples.node.setPosition(Edge.Left, 0);
  barSamples.node.setPosition(Edge.Right, 0);
  barSamples.node.setHeight(
    Math.min(7, mainChart.node.getHeight().value * 0.04 + 1)
  );

  return {
    node,
    draw: (context) => {
      drawElement(barSamples, context);
      drawElement(mainChart, context);
    },
    handle: mainChart.handle, // forward to main chart - this should work...
  };
};

const CanvasDistChart: CC<{
  shapes: (SqShape & {
    name: string;
    p5: result<number, SqDistributionError>;
    p50: result<number, SqDistributionError>;
    p95: result<number, SqDistributionError>;
  })[];
  samples: number[];
  innerHeight: number;
  isMulti: boolean; // enables legend and semi-transparent rendering
  samplesBarSetting: SampleBarSetting;
  showCursorLine: boolean;
  showPercentileLines: boolean;
  showXAxis: boolean;
  discreteTooltip: DiscreteTooltip | undefined;
  setDiscreteTooltip: (value: DiscreteTooltip | undefined) => void;
  cursor: Point | undefined;
  xScale: AnyNumericScale;
  yScale: AnyNumericScale;
  verticalLine: number | undefined;
  xTickFormat: string | undefined;
  xAxisTitle: string | undefined;
}> = ({
  innerHeight,
  shapes,
  isMulti,
  showPercentileLines,
  setDiscreteTooltip,
  showCursorLine,
  xScale,
  yScale,
  verticalLine,
  showXAxis,
  discreteTooltip,
  cursor,
  xTickFormat,
  xAxisTitle,
  samples,
  samplesBarSetting,
}) => {
  let barSamples: CanvasElement | undefined;
  if (samplesBarSetting !== "none") {
    barSamples = BarSamples({
      behindShapes: samplesBarSetting === "behind",
      samples,
      scale: xScale,
    });
  }

  const mainChart = MainChart({
    height: innerHeight,
    shapes,
    isMulti,
    showPercentileLines,
    discreteTooltip,
    setDiscreteTooltip,
    cursor: showCursorLine ? cursor : undefined,
    xScale,
    yScale,
    xTickFormat,
    verticalLine,
  });

  const mainChartWithBarSamplesBehind =
    samplesBarSetting === "behind"
      ? MainChartWithBarSamplesBehind({
          mainChart,
          barSamples: BarSamples({
            behindShapes: true,
            samples,
            scale: xScale,
          }),
        })
      : mainChart;

  const chart = AxesContainer({
    xScale,
    yScale,
    showAxisLines: true,
    showXAxis,
    showYAxis: false,
    child: mainChartWithBarSamplesBehind,
    xTickFormat,
  });
  const chartWithTitles = AxesTitlesContainer({
    xAxisTitle,
    child: chart,
  });

  const rootNode = makeNode();
  rootNode.insertChild(chartWithTitles.node, rootNode.getChildCount());

  if (barSamples && samplesBarSetting === "bottom") {
    rootNode.insertChild(barSamples.node, rootNode.getChildCount());
  }

  return {
    node: rootNode,
    draw: (context) => {
      drawElement(chartWithTitles, context);
      if (barSamples && samplesBarSetting === "bottom") {
        drawElement(barSamples, context);
      }
    },
  };
};

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
  samplesBarSetting: SampleBarSetting;
  showCursorLine: boolean;
  showPercentileLines: boolean;
  showAxisTitles: boolean;
  showXAxis: boolean;
}> = ({
  shapes: unAdjustedShapes,
  samples,
  plot,
  height: innerHeight,
  isMulti,
  samplesBarSetting,
  showAxisTitles,
  showCursorLine,
  showPercentileLines,
  showXAxis,
}) => {
  const verticalLine = useSelectedVerticalLine();

  const [discreteTooltip, setDiscreteTooltip] = useState<
    DiscreteTooltip | undefined
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
      Math.min(0, ...domain.map((p) => p.y)),
      Math.max(0, ...domain.map((p) => p.y)),
    ]);

    return { xScale, yScale };
  }, [domain, plot.xScale, plot.yScale]);

  const { cursor, initCursor } = useCanvasCursor();

  // TODO - memoize this and `calculateLayout` call below?
  const chart = useMemo(
    () =>
      CanvasDistChart({
        innerHeight: innerHeight,
        shapes,
        isMulti,
        showPercentileLines,
        discreteTooltip,
        setDiscreteTooltip,
        cursor,
        xScale,
        yScale,
        showXAxis,
        xTickFormat: plot.xScale.tickFormat,
        xAxisTitle: showAxisTitles ? plot.xScale.title : undefined,
        verticalLine,
        showCursorLine,
        samples,
        samplesBarSetting,
      }),
    [
      innerHeight,
      shapes,
      isMulti,
      showPercentileLines,
      discreteTooltip,
      setDiscreteTooltip,
      cursor,
      xScale,
      yScale,
      showXAxis,
      plot.xScale.tickFormat,
      plot.xScale.title,
      verticalLine,
      showAxisTitles,
      showCursorLine,
      samples,
      samplesBarSetting,
    ]
  );

  return (
    <MouseTooltip
      isOpen={!!discreteTooltip}
      render={() =>
        discreteTooltip ? (
          <div
            className={clsx(
              "grid gap-x-2 rounded border border-gray-300 bg-white p-2 text-xs"
            )}
            style={{
              gridTemplateColumns: "min-content min-content",
            }}
          >
            <div className="text-right text-gray-500">Value:</div>
            <div>
              {xScale.tickFormat(
                undefined,
                plot.xScale.tickFormat
              )(discreteTooltip.value)}
            </div>
            <div className="text-right text-gray-500">Probability:</div>
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
      <div ref={outerRef}>
        <ReactCanvas alt="Distributions plot"></ReactCanvas>
      </div>
    </MouseTooltip>
  );
};

export const DistributionsChart: FC<DistributionsChartProps> = ({
  plot,
  environment,
  height,
}) => {
  const viewerType = useViewerType();

  const CUTOFF_TO_SHOW_SAMPLES_BAR = 100000; // Default to stop showing bottom samples bar if there are more than 100k samples
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

  const showAxisTitles = height > 30;
  const shownXAxisTitle = showAxisTitles && !!plot.xScale.title;
  const showXAxis = height > 15;
  const nonTitleHeight = Math.max(height - (showXAxis ? 20 : 0), 0);

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
      <TextTooltip text={message} placement="top">
        <div className="ml-2 w-fit rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-900">
          Not Normalized
        </div>
      </TextTooltip>
    );
  };

  const isMulti =
    distributions.length > 1 ||
    Boolean(distributions.length === 1 && distributions[0].name);

  let samplesState: SampleBarSetting = "none";

  const size = nonTitleHeight > 150 ? "large" : "small";

  //It probably would be nices to show samples behind, if its small and there's an xAxisTitle, but that would require messing more with the yPadding in the draw/index file.
  if (
    samples.length < 10 ||
    samples.length > CUTOFF_TO_SHOW_SAMPLES_BAR ||
    isMulti ||
    nonTitleHeight <= 15
  ) {
    samplesState = "none";
  } else if (size == "small" && !shownXAxisTitle) {
    samplesState = "behind";
  } else {
    samplesState = "bottom";
  }

  const hasLogError =
    plot.xScale.method?.type === "log" && shapes.value.some(hasMassBelowZero);

  return (
    <DistProvider generateInitialValue={() => ({})}>
      {plot.title && <PlotTitle title={plot.title} />}
      {hasLogError && (
        <ErrorAlert heading="Log Domain Error">
          Cannot graph distribution with negative values on logarithmic scale.
        </ErrorAlert>
      )}

      {!hasLogError && (
        <>
          <div className="flex flex-col items-stretch">
            <div
              className="flex-1"
              /*
               * In tooltips, dist widgets are setting their own size, so without
               * max width there's a risk that the canvas would expand
               * incrementally because of its ResizeObserver.
               *
               * Note that 300px is the default width in HTML5 Canvas standard,
               * so it's the safest default. So any smaller `maxWidth` could
               * still cause incremental expanding up to that value.
               *
               * See also: https://github.com/quantified-uncertainty/squiggle/issues/3013
               */
              style={viewerType === "tooltip" ? { maxWidth: 300 } : undefined}
            >
              <InnerDistributionsChart
                isMulti={isMulti}
                samples={samples}
                shapes={shapes.value}
                plot={plot}
                height={height}
                samplesBarSetting={samplesState}
                showCursorLine={nonTitleHeight > 30}
                // We don't want to show percentile lines if it's not normalized, as they wouldn't make sense.
                showPercentileLines={
                  !anyAreNonnormalized && nonTitleHeight > 30
                }
                showXAxis={showXAxis}
                showAxisTitles={showAxisTitles}
              />
            </div>

            {!anyAreNonnormalized &&
              plot.showSummary &&
              nonTitleHeight > 30 && (
                <div
                  className={clsx("mt-3 self-end", size === "large" && "pt-5")}
                >
                  <SummaryTable
                    plot={plot}
                    environment={environment}
                    size={size}
                  />
                </div>
              )}
            {anyAreNonnormalized && height > 20 && (
              <div className="flex-1 pt-2"> {nonNormalizedError()}</div>
            )}
          </div>
        </>
      )}
    </DistProvider>
  );
};
