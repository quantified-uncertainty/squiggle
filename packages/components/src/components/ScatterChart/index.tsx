import React, { FC, useCallback, useMemo } from "react";

import { Env, SqScatterPlot } from "@quri/squiggle-lang";
import * as d3 from "d3";
import { DrawContext, useCanvas } from "../../lib/hooks/index.js";
import { ErrorAlert } from "../Alert.js";
import { drawAxes, drawCircle, primaryColor } from "../../lib/draw/index.js";

type Props = {
  plot: SqScatterPlot;
  height: number;
  environment: Env;
};

export const ScatterChart: FC<Props> = ({ plot, height, environment }) => {
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

      const xDomain = d3.extent(points, (d) => d.x) as [number, number];
      const yDomain = d3.extent(points, (d) => d.y) as [number, number];

      const { xScale, yScale, translateToZero } = drawAxes({
        context,
        xDomain,
        yDomain,
        suggestedPadding: {
          top: 10,
          bottom: 16,
          left: 0,
          right: 0,
        },
        width,
        height,
        drawTicks: true,
      });
      translateToZero();

      const r = 2;
      context.fillStyle = primaryColor;
      context.globalAlpha = 0.15;
      for (const d of points) {
        const x = xScale(d.x),
          y = yScale(d.y);

        drawCircle({ context, x, y, r });
      }
      context.globalAlpha = 1;
    },
    [pointsResult, height]
  );

  const { ref } = useCanvas({ height, draw });

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
