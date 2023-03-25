import * as d3 from "d3";
import * as React from "react";
import { FC, useEffect, useMemo, useRef } from "react";
import { useMeasure } from "react-use";

import { SqLambda } from "@quri/squiggle-lang";

import { ErrorAlert } from "../Alert";
import { FunctionChartSettings } from "./index";
import { drawAxes, getFunctionImage } from "./utils";
import { useCanvas } from "../../lib/hooks";

type Props = {
  fn: SqLambda;
  settings: FunctionChartSettings;
  height: number;
};

const InnerFunctionChart: FC<Props & { width: number }> = ({
  fn,
  settings,
  width,
  height,
}) => {
  const { ref, context } = useCanvas();

  const { functionImage, errors } = useMemo(
    () => getFunctionImage({ settings, fn, valueType: "Number" }),
    [settings, fn]
  );

  useEffect(() => {
    if (!context) {
      return;
    }
    context.clearRect(0, 0, width, height);

    const { xScale, yScale, padding, chartHeight } = drawAxes({
      suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
      xDomain: d3.extent(functionImage, (d) => d.x) as [number, number],
      yDomain: d3.extent(functionImage, (d) => d.y) as [number, number],
      width,
      height,
      context,
    });

    const lineColor = "#4c78a8";

    // line
    context.translate(padding.left, chartHeight + padding.top);
    context.scale(1, -1);
    context.beginPath();
    context.strokeStyle = lineColor;
    context.lineWidth = 2;
    context.imageSmoothingEnabled = true;

    d3
      .line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .context(context)(functionImage);

    context.stroke();
  }, [context, width, height, functionImage, settings]);

  return (
    <div>
      <canvas width={width} height={height} ref={ref}>
        Chart for {fn.toString()}
      </canvas>
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

export const FunctionChart1Number: FC<Props> = (props) => {
  const [containerRef, containerMeasure] = useMeasure<HTMLDivElement>();

  return (
    <div ref={containerRef}>
      {containerMeasure.width ? (
        <InnerFunctionChart {...props} width={containerMeasure.width} />
      ) : null}
    </div>
  );
};
