import _ from "lodash";
import * as React from "react";
import { FC, useEffect, useMemo } from "react";
import * as d3 from "d3";

import { SqLambda } from "@quri/squiggle-lang";

import { useMeasure } from "react-use";
import { ErrorAlert } from "./Alert";
import { FunctionChartSettings } from "./FunctionChart";

function rangeByCount(start: number, stop: number, count: number) {
  const step = (stop - start) / (count - 1);
  const items = _.range(start, stop, step);
  const result = items.concat([stop]);
  return result;
}

function getFunctionImage({
  settings,
  fn,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
}) {
  const chartPointsToRender = rangeByCount(
    settings.start,
    settings.stop,
    settings.count
  );

  let functionImage: { x: number; y: number }[] = [];
  let errors: { x: number; value: string }[] = [];

  for (const x of chartPointsToRender) {
    const result = fn.call([x]);
    if (result.ok) {
      if (result.value.tag === "Number") {
        functionImage.push({ x, y: result.value.value });
      } else {
        errors.push({ x, value: "This component expected number outputs" });
      }
    } else {
      errors.push({ x, value: result.value.toString() });
    }
  }

  return { errors, functionImage };
}

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
  const ref = React.useRef<HTMLCanvasElement>(null);

  const { functionImage, errors } = useMemo(
    () => getFunctionImage({ settings, fn }),
    [settings, fn]
  );

  const devicePixelRatio = window.devicePixelRatio || 1;

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const canvas = ref.current;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.style.width = `${canvas.clientWidth}px`;
    canvas.style.height = `${canvas.clientHeight}px`;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }, [devicePixelRatio]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const context = ref.current.getContext("2d");
    if (!context) {
      return;
    }
    context.resetTransform();
    context.scale(devicePixelRatio, devicePixelRatio);
    context.clearRect(0, 0, width, height);

    const axisColor = "rgba(114, 125, 147, 0.1)";
    const labelColor = "rgb(114, 125, 147)";
    const tickCount = 5;
    const tickFormat = ".9~s";
    const lineColor = "#4c78a8";
    const xLabelOffset = 6;
    const yLabelOffset = 6;

    // modified later according to label width
    const padding = { left: 20, right: 10, top: 10, bottom: 20 };

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(functionImage, (d) => d.x) as [number, number]);
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(functionImage, (d) => d.y) as [number, number]);

    const xTicks = xScale.ticks(tickCount);
    const xTickFormat = xScale.tickFormat(tickCount, tickFormat);

    const yTicks = yScale.ticks(tickCount);
    const yTickFormat = yScale.tickFormat(tickCount, tickFormat);

    // measure tick sizes for dynamic padding
    yTicks.forEach((d) => {
      const measured = context.measureText(yTickFormat(d));
      padding.left = Math.max(
        padding.left,
        measured.actualBoundingBoxLeft +
          measured.actualBoundingBoxRight +
          yLabelOffset
      );
    });
    xTicks.forEach((d) => {
      const measured = context.measureText(xTickFormat(d));
      padding.right = Math.max(
        padding.right,
        (measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight) / 2
      );
    });

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    xScale.range([0, chartWidth]);
    yScale.range([0, chartHeight]);

    // x axis
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(padding.left, padding.top + chartHeight);
    context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = labelColor;

    xTicks.forEach((d) => {
      context.beginPath();
      context.fillText(
        xTickFormat(d),
        padding.left + xScale(d),
        padding.top + chartHeight + xLabelOffset
      );
    });

    // y axis
    context.beginPath();
    context.strokeStyle = axisColor;
    context.lineWidth = 1;
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, padding.top + chartHeight);
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = labelColor;

    yTicks.forEach((d) => {
      context.beginPath();
      context.fillText(
        yTickFormat(d),
        padding.left - 6,
        padding.top + chartHeight - yScale(d)
      );
    });

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
  }, [width, height, functionImage, settings, devicePixelRatio]);

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
