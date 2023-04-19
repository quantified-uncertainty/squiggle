import React, { FC, useCallback, useMemo } from "react";

import { Env, SqScatterPlot } from "@quri/squiggle-lang";
import * as d3 from "d3";
import {
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "../../lib/hooks/index.js";
import { ErrorAlert } from "../Alert.js";
import {
  drawAxes,
  drawCircle,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";

type Props = {
  plot: SqScatterPlot;
  height: number;
  environment: Env;
};

export const ScatterChart: FC<Props> = ({ plot, height, environment }) => {
  const { cursor, initCursor } = useCanvasCursor();

  const pointsResult = useMemo(
    () => plot.points(environment),
    [plot, environment]
  );

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      if (!pointsResult.ok) {
        return;
      }

      const points = pointsResult.value;

      const xScale = plot.logX ? d3.scaleSymlog() : d3.scaleLinear();
      const yScale = plot.logY ? d3.scaleSymlog() : d3.scaleLinear();
      xScale.domain(d3.extent(points, (d) => d.x) as [number, number]);
      yScale.domain(d3.extent(points, (d) => d.y) as [number, number]);

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
        tickCount: 30,
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
    [pointsResult, height, cursor, plot.logX, plot.logY]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref}>Chart for {plot.toString()}</canvas>
      {!pointsResult.ok && (
        <ErrorAlert heading="Conversion error">
          {pointsResult.value.toString()}
        </ErrorAlert>
      )}
    </div>
  );
};
