import React, { FC, useCallback, useMemo } from "react";

import {
  Env,
  SqSampleSetDistribution,
  SqScatterPlot,
} from "@quri/squiggle-lang";
import * as d3 from "d3";
import {
  AnyChartScale,
  drawAxes,
  drawCircle,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import {
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "../../lib/hooks/index.js";
import { ErrorAlert } from "../Alert.js";

type Props = {
  plot: SqScatterPlot;
  height: number;
  environment: Env;
};

function buildScaleFromSampleSet({
  dist,
  isLogarithmic,
}: {
  dist: SqSampleSetDistribution;
  isLogarithmic: boolean;
}) {
  const samples = dist.getSamples();
  let scale: AnyChartScale;
  if (isLogarithmic) {
    // TODO - calculate the optimal value of the constant
    scale = d3.scaleSymlog().constant(1);
  } else {
    scale = d3.scaleLinear();
  }
  scale.domain(d3.extent(samples) as [number, number]);
  return scale;
}

export const ScatterChart: FC<Props> = ({ plot, height, environment }) => {
  const { cursor, initCursor } = useCanvasCursor();

  const { xDist, yDist } = useMemo(
    () => ({
      xDist: plot.xDist(environment),
      yDist: plot.yDist(environment),
    }),
    [plot, environment]
  );
  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      if (!xDist.ok || !yDist.ok) {
        return;
      }

      const points = SqScatterPlot.zipToPoints(xDist.value, yDist.value);

      const xScale = buildScaleFromSampleSet({
        dist: xDist.value,
        isLogarithmic: plot.logX,
      });
      const yScale = buildScaleFromSampleSet({
        dist: yDist.value,
        isLogarithmic: plot.logY,
      });

      const { frame, padding } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: {
          top: 10,
          bottom: 16,
          left: 0,
          right: 0,
        },
        xScale,
        yScale,
        tickCount: 20,
        drawTicks: true,
      });

      frame.enter();
      const r = 2;
      context.fillStyle = primaryColor;
      context.globalAlpha = 0.15;
      for (const d of points) {
        const x = xScale(d.x),
          y = yScale(d.y);

        drawCircle({ context, x, y, r });
      }
      context.globalAlpha = 1;
      frame.exit();

      if (
        cursor &&
        cursor.x >= padding.left &&
        cursor.x - padding.left <= frame.width &&
        cursor.y >= padding.top &&
        cursor.y - padding.top <= frame.height
      ) {
        drawCursorLines({
          frame,
          cursor,
          x: {
            scale: xScale,
            format: d3.format(",.4r"),
          },
          y: {
            scale: yScale,
            format: d3.format(",.4r"),
          },
        });
      }
    },
    [xDist, yDist, height, cursor, plot.logX, plot.logY]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref}>Chart for {plot.toString()}</canvas>
      {[xDist, yDist].map((dist) =>
        dist.ok ? null : (
          <ErrorAlert heading="Conversion error">
            {dist.value.toString()}
          </ErrorAlert>
        )
      )}
    </div>
  );
};
