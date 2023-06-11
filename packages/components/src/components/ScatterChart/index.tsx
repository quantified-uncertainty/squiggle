import React, { FC, useCallback, useMemo } from "react";

import { Env, SqLinearScale, SqScatterPlot } from "@quri/squiggle-lang";
import * as d3 from "d3";
import {
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
import { sqScaleToD3, canvasClasses } from "../../lib/utility.js";
import { ErrorAlert } from "../Alert.js";

type Props = {
  plot: SqScatterPlot;
  height: number;
  environment: Env;
};

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

      const xSqScale = plot.xScale ?? SqLinearScale.create();
      const xScale = sqScaleToD3(xSqScale);
      xScale.domain([
        xSqScale.min ?? d3.min(xDist.value.getSamples())!,
        xSqScale.max ?? d3.max(xDist.value.getSamples())!,
      ]);

      const ySqScale = plot.yScale ?? SqLinearScale.create();
      const yScale = sqScaleToD3(ySqScale);
      yScale.domain([
        ySqScale.min ?? d3.min(yDist.value.getSamples())!,
        ySqScale.max ?? d3.max(yDist.value.getSamples())!,
      ]);

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
        xTickFormat: plot.xScale?.tickFormat,
        yTickFormat: plot.yScale?.tickFormat,
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
    [xDist, yDist, height, cursor, plot.xScale, plot.yScale]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref} className={canvasClasses}>Chart for {plot.toString()}</canvas>
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
