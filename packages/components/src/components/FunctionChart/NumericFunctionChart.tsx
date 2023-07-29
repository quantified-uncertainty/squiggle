import * as d3 from "d3";
import { FC, useCallback, useMemo } from "react";

import { Env, SqNumericFnPlot } from "@quri/squiggle-lang";

import {
  drawAxes,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { canvasClasses } from "../../lib/utility.js";
import { getFunctionImage } from "./utils.js";
import { sqScaleToD3 } from "../../lib/d3/index.js";
import { NumberShower } from "../NumberShower.js";

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

  const { functionImage, errors, allValues } = useMemo(
    () => getFunctionImage(plot, environment),
    [plot, environment]
  );

  const draw = useCallback(
    ({
      context,
      width,
    }: {
      context: CanvasRenderingContext2D;
      width: number;
    }) => {
      context.clearRect(0, 0, width, height);

      const xScale = sqScaleToD3(plot.xScale);
      xScale.domain(
        d3.extent(
          functionImage.filter((d) => isFinite(d.x)),
          (d) => d.x
        ) as [number, number]
      );

      const yScale = sqScaleToD3(plot.yScale);
      yScale.domain(
        !!plot.yScale.min && !!plot.yScale.max
          ? [plot.yScale.min, plot.yScale.max]
          : (d3.extent(
              functionImage.filter((d) => isFinite(d.y)),
              (d) => d.y
            ) as [number, number])
      );

      const { frame, padding } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xScale,
        yScale,
        xTickFormat: plot.xScale.tickFormat,
        yTickFormat: plot.yScale.tickFormat,
      });

      if (
        plot.xScale.tag === "log" &&
        functionImage[0] &&
        functionImage[0].x <= 0
      ) {
        frame.enter();
        frame.fillText(
          "Invalid X Scale settings",
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

      if (
        cursor &&
        cursor.x >= padding.left &&
        cursor.x - padding.left <= frame.width
      ) {
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
      }
    },
    [functionImage, height, cursor, plot]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      {errors.length > 0 && (
        <div className="w-20 rounded-sm px-1 py-0.5 bg-red-100 text-red-900 text-sm font-semibold">
          {`${errors.length} Errors`}
        </div>
      )}
      <canvas ref={ref} className={canvasClasses}>
        Chart for {plot.toString()}
      </canvas>
      <div className="overflow-auto max-h-[500px] mt-3">
        <table className="table-fixed width-full w-full border border-collapse border-slate-300 border-b text-sm">
          <thead>
            <tr className="text-slate-600 font-semibold text-xm bg-slate-100">
              <th className="border border-slate-200 py-1 px-2 ">index</th>
              <th className="border border-slate-200 py-1 px-2 ">x</th>
              <th className="border border-slate-200 py-1 px-2 w-3/5">
                y = f(x)
              </th>
            </tr>
          </thead>
          <tbody>
            {allValues.map((d, index) => (
              <tr key={d.x}>
                <td
                  className={
                    "px-5 py-1 border border-slate-200 opacity-50 font-mono overflow-hidden"
                  }
                >
                  {index}
                </td>
                <td
                  className={
                    "px-5 py-1 border border-slate-200 overflow-hidden"
                  }
                >
                  <NumberShower number={d.x} precision={4} />
                </td>
                <td
                  className={
                    "px-5 py-1 border border-slate-200 text-blue-800 overflow-hidden"
                  }
                >
                  {d.y.ok && isFinite(d.y.value) ? (
                    <NumberShower number={d.y.value} precision={4} />
                  ) : (
                    <span className="text-red-700">Error: {d.y.value}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
