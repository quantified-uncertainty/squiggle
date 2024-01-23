import * as d3 from "d3";
import { FC, useCallback, useMemo } from "react";

import { Env, SqScale, SqScatterPlot } from "@quri/squiggle-lang";

import { sqScaleToD3 } from "../../../lib/d3/index.js";
import {
  drawAxes,
  drawCircle,
  drawCursorLines,
  primaryColor,
} from "../../../lib/draw/index.js";
import {
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "../../../lib/hooks/index.js";
import { canvasClasses } from "../../../lib/utility.js";
import { PlotTitle } from "../PlotTitle.js";

type Props = {
  plot: SqScatterPlot;
  height: number;
  environment: Env;
};

export const ScatterChart: FC<Props> = ({ plot, height }) => {
  const { cursor, initCursor } = useCanvasCursor();

  const { xDist, yDist } = useMemo(
    () => ({
      xDist: plot.xDist(),
      yDist: plot.yDist(),
    }),
    [plot]
  );
  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      const points = SqScatterPlot.zipToPoints(xDist, yDist);

      const xSqScale = plot.xScale ?? SqScale.linearDefault();
      const xScale = sqScaleToD3(xSqScale);
      xScale.domain([
        xSqScale.min ?? d3.min(xDist.getSamples()) ?? 0,
        xSqScale.max ?? d3.max(xDist.getSamples()) ?? 0,
      ]);

      const ySqScale = plot.yScale ?? SqScale.linearDefault();
      const yScale = sqScaleToD3(ySqScale);
      yScale.domain([
        ySqScale.min ?? d3.min(yDist.getSamples()) ?? 0,
        ySqScale.max ?? d3.max(yDist.getSamples()) ?? 0,
      ]);

      const { frame } = drawAxes({
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
        xAxisTitle: plot.xScale?.title,
        yAxisTitle: plot.yScale?.title,
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

      drawCursorLines({
        frame,
        cursor,
        x: {
          scale: xScale,
          format: xSqScale.tickFormat,
        },
        y: {
          scale: yScale,
          format: ySqScale.tickFormat,
        },
      });
    },
    [xDist, yDist, height, cursor, plot.xScale, plot.yScale]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      {plot.title && <PlotTitle title={plot.title} />}
      <canvas ref={ref} className={canvasClasses}>
        Chart for {plot.toString()}
      </canvas>
    </div>
  );
};
