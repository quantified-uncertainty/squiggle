import * as d3 from "d3";
import { FC, useCallback, useMemo } from "react";

import { Env, SqNumericFnPlot } from "@quri/squiggle-lang";

import { sqScaleToD3 } from "../../lib/d3/index.js";
import {
  drawAxes,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import {
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "../../lib/hooks/index.js";
import { canvasClasses } from "../../lib/utility.js";
import { ImageErrors } from "./ImageErrors.js";
import { getFunctionImage } from "./utils.js";
import { PlotTitle } from "../PlotTitle.js";

type Props = {
  plot: SqNumericFnPlot;
  environment: Env;
  height: number;
};

export const NumericFunctionChart: FC<Props> = ({
  plot,
  environment,
  height: innerHeight,
}) => {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below
  const { cursor, initCursor } = useCanvasCursor();

  const { functionImage, errors, xScale } = useMemo(
    () => getFunctionImage(plot, environment),
    [plot, environment]
  );

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const yScale = sqScaleToD3(plot.yScale);
      yScale.domain(
        !!plot.yScale.min && !!plot.yScale.max
          ? [plot.yScale.min, plot.yScale.max]
          : (d3.extent(
              functionImage.filter((d) => isFinite(d.y)),
              (d) => d.y
            ) as [number, number])
      );

      const { frame } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xScale,
        yScale,
        xTickFormat: plot.xScale.tickFormat,
        yTickFormat: plot.yScale.tickFormat,
        xAxisTitle: plot.xScale.title,
        yAxisTitle: plot.yScale.title,
      });

      if (
        plot.xScale.tag === "log" &&
        functionImage[0] &&
        functionImage[0].x <= 0
      ) {
        frame.enter();
        frame.fillText(
          "Log scale requires positive X Scale range",
          frame.width / 2,
          frame.height / 2,
          {
            textAlign: "center",
            textBaseline: "middle",
            font: "12px Arial",
            fillStyle: "red",
          }
        );
        frame.exit();
        return;
      }

      // line
      frame.enter();
      context.beginPath();
      context.strokeStyle = primaryColor;
      context.lineWidth = 2;
      context.imageSmoothingEnabled = true;

      d3
        .line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .context(context)(functionImage);

      context.stroke();
      frame.exit();

      drawCursorLines({
        frame,
        cursor,
        x: {
          scale: xScale,
          format: plot.xScale.tickFormat,
        },
        y: {
          scale: yScale,
          format: plot.yScale.tickFormat,
        },
      });
    },
    [functionImage, height, cursor, plot, xScale]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      {plot.title && <PlotTitle title={plot.title} />}
      <canvas ref={ref} className={canvasClasses}>
        Chart for {plot.toString()}
      </canvas>
      <ImageErrors errors={errors} />
    </div>
  );
};
