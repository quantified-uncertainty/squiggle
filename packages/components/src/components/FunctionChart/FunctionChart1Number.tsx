import { extent as d3Extent } from "d3-array";
import { line as d3Line } from "d3-shape";

import * as React from "react";
import { FC, useEffect, useMemo } from "react";
import { useMeasure } from "react-use";

import { SqLambda } from "@quri/squiggle-lang";

import { ErrorAlert } from "../Alert";
import { FunctionChartSettings } from "./index";
import { drawAxes, getFunctionImage, primaryColor } from "../../lib/drawUtils";
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
  height: innerHeight,
}) => {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below

  const { ref, context } = useCanvas({ width, height });

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
      xDomain: d3Extent(functionImage, (d) => d.x) as [number, number],
      yDomain: d3Extent(functionImage, (d) => d.y) as [number, number],
      width,
      height,
      context,
    });

    // line
    context.translate(padding.left, chartHeight + padding.top);
    context.scale(1, -1);
    context.beginPath();
    context.strokeStyle = primaryColor;
    context.lineWidth = 2;
    context.imageSmoothingEnabled = true;

    d3Line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .context(context)(functionImage);

    context.stroke();
  }, [context, width, height, functionImage, settings]);

  return (
    <div>
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
