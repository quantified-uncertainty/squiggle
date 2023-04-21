import * as d3 from "d3";

import * as React from "react";
import { FC, useCallback, useMemo } from "react";

import { SqLambda, SqScale } from "@quri/squiggle-lang";

import {
  drawAxes,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { ErrorAlert } from "../Alert.js";
import { FunctionChartSettings } from "./index.js";
import { getFunctionImage } from "./utils.js";
import { sqScaleToD3 } from "../../lib/utility.js";

type Props = {
  fn: SqLambda;
  xScale: SqScale;
  settings: FunctionChartSettings;
  height: number;
};

export const FunctionChart1Number: FC<Props> = ({
  fn,
  settings,
  xScale: xSqScale,
  height: innerHeight,
}) => {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below
  const { cursor, initCursor } = useCanvasCursor();

  const { functionImage, errors } = useMemo(
    () =>
      getFunctionImage({ settings, fn, xScale: xSqScale, valueType: "Number" }),
    [settings, fn, xSqScale]
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

      const xScale = sqScaleToD3(xSqScale);
      xScale.domain(d3.extent(functionImage, (d) => d.x) as [number, number]);

      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(functionImage, (d) => d.y) as [number, number]);

      const { frame, padding } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xScale,
        yScale,
      });

      if (xSqScale.tag === "log" && functionImage[0].x <= 0) {
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
            format: d3.format(",.4r"),
          },
          y: {
            scale: yScale,
            format: d3.format(",.4r"),
          },
        });
      }
    },
    [functionImage, height, cursor, xSqScale]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref}>Chart for {fn.toString()}</canvas>
      <div className="space-y-1">
        {errors.map(({ x, value }) => (
          // TODO - group errors with identical value
          <ErrorAlert key={x} heading={value}>
            Error at point {x}
          </ErrorAlert>
        ))}
      </div>
    </div>
  );
};
