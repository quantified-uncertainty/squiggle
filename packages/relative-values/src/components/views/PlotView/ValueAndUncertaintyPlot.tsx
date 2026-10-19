"use client";
import * as d3 from "d3";
import { FC, useCallback, useMemo, useState } from "react";

import {
  d3Extended,
  drawAxes,
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "@quri/squiggle-components";
import { MouseTooltip } from "@quri/ui";

import type { Clusters, Item } from "../../../types.js";
import { extractOkValues } from "../../../values/ModelEvaluator.js";
import type { RelativeValueResult } from "../../../values/types.js";
import { hasInvalid } from "../../../values/value.js";
import {
  formatNumberString,
  kindPrecision,
  type ResolvedFormat,
} from "../../host/format.js";
import type {
  RelativeValuesLabels,
  RelativeValuesNumberKind,
} from "../../host/types.js";
import { cssVariable } from "./canvasColors.js";
import { distance } from "./ForcePlot.js";
import { ItemTooltip } from "./ItemTooltip.js";

type Datum = {
  item: Item;
  median: number;
  uncertainty: number;
};

function average(
  item: Item,
  reference: readonly Item[],
  compare: (id1: string, id2: string) => RelativeValueResult | undefined
) {
  const values = extractOkValues(
    reference.flatMap((other) => {
      const result = compare(item.id, other.id);
      return result ? [result] : [];
    })
  ).filter((value) => !hasInvalid(value));
  if (values.length === 0) {
    return undefined;
  }
  return {
    median: d3.mean(values, (value) => value.median) ?? NaN,
    uncertainty: d3.mean(values, (value) => value.uncertainty) ?? NaN,
  };
}

type ChartScale = ReturnType<typeof d3Extended.scaleLinear>;

// Tick labels through `format.formatNumber` (place "plot"), when it returns
// a string; drawAxes asks the scale for its tick format.
function withTickFormat(
  scale: ChartScale,
  format: ResolvedFormat,
  kind: RelativeValuesNumberKind
): ChartScale {
  const formatNumber = format.formatNumber;
  if (!formatNumber) {
    return scale;
  }
  const builtin = scale.tickFormat.bind(scale);
  const precision = kindPrecision(format, kind, "plot");
  scale.tickFormat = (count?: number, specifier?: string) => {
    const fallback = builtin(count, specifier);
    return (value: d3.NumberValue) =>
      formatNumber(Number(value), { kind, place: "plot", precision }) ??
      fallback(value);
  };
  return scale;
}

/** Items by value (x) and uncertainty (y), against a reference. */
export const ValueAndUncertaintyPlot: FC<{
  items: readonly Item[];
  // One item (the unit), or several (averaged).
  reference: readonly Item[];
  clusters: Clusters;
  compare: (id1: string, id2: string) => RelativeValueResult | undefined;
  height: number;
  xScale: "log" | "linear";
  yScale: "linear" | "log";
  labels: RelativeValuesLabels;
  format: ResolvedFormat;
  selectedItem: string | null;
  onItemClick: (item: Item) => void;
}> = ({
  items,
  reference,
  clusters,
  compare,
  height,
  xScale: xScaleType,
  yScale: yScaleType,
  labels,
  format,
  selectedItem,
  onItemClick,
}) => {
  const { cursor, initCursor } = useCanvasCursor();
  const [hoveredId, setHoveredId] = useState<number | undefined>(undefined);

  const comparedToAverage = reference.length > 1;
  const data = useMemo(() => {
    const data: Datum[] = [];
    for (const item of items) {
      const value = average(item, reference, compare);
      // A log scale can't show zero (e.g. the unit against itself has no
      // uncertainty) or, for values, a zero median.
      if (
        value &&
        (yScaleType !== "log" || value.uncertainty > 0) &&
        (xScaleType !== "log" || Math.abs(value.median) > 0)
      ) {
        data.push({ item, ...value });
      }
    }
    return data;
  }, [items, reference, compare, xScaleType, yScaleType]);

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const makeScale = (type: "log" | "linear") =>
        type === "log" ? d3Extended.scaleLog() : d3Extended.scaleLinear();
      const xValue = (d: Datum) =>
        xScaleType === "log" ? Math.abs(d.median) : d.median;
      const yValue = (d: Datum) => d.uncertainty;
      const xScale = withTickFormat(
        makeScale(xScaleType).domain(
          d3.extent(data, xValue) as [number, number]
        ),
        format,
        "median"
      );
      const yScale = withTickFormat(
        makeScale(yScaleType).domain(
          d3.extent(data, yValue) as [number, number]
        ),
        format,
        "uncertainty"
      );

      const { padding, frame } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: { top: 10, bottom: 40, left: 60, right: 20 },
        xScale,
        yScale,
      });

      const muted = cssVariable(
        context.canvas,
        "--squiggle-rv-muted",
        "rgb(114, 125, 147)" // copy-paste from drawUtils
      );
      const accent = cssVariable(
        context.canvas,
        "--squiggle-rv-accent",
        "#334155"
      );
      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.font = "bold 12px sans-serif";
      context.fillStyle = muted;
      context.fillText(
        comparedToAverage ? labels["plot.xAxisAverage"] : labels["plot.xAxis"],
        width - padding.right,
        height
      );

      context.save();
      context.textAlign = "right";
      context.textBaseline = "top";
      context.rotate(-Math.PI / 2);
      context.fillText(
        comparedToAverage ? labels["plot.yAxisAverage"] : labels["plot.yAxis"],
        -padding.top,
        0
      );
      context.restore();

      context.save();
      context.translate(padding.left, height - padding.bottom);
      context.scale(1, -1);

      const r = 5;
      let newHoveredId: typeof hoveredId;
      for (let i = 0; i < data.length; i++) {
        const d = data[i];

        context.beginPath();
        const x = xScale(xValue(d)),
          y = yScale(yValue(d));
        context.moveTo(x + r, y);
        context.arc(x, y, r, 0, 2 * Math.PI);

        const isHovered =
          cursor &&
          distance(
            { x: x + padding.left, y: padding.top + frame.height - y },
            cursor
          ) <
            r * 1.5;
        if (isHovered) {
          newHoveredId = i; // last one wins
        }

        context.fillStyle =
          (!isHovered &&
            d.item.clusterId &&
            clusters[d.item.clusterId]?.color) ||
          "black";
        context.fill();
        if (d.item.id === selectedItem) {
          context.beginPath();
          context.arc(x, y, r + 3, 0, 2 * Math.PI);
          context.strokeStyle = accent;
          context.lineWidth = 2;
          context.stroke();
        }
      }

      context.canvas.style.cursor =
        newHoveredId === undefined ? "auto" : "pointer";
      setHoveredId(newHoveredId);
      context.restore();
    },
    [
      data,
      clusters,
      cursor,
      comparedToAverage,
      height,
      xScaleType,
      yScaleType,
      labels,
      format,
      selectedItem,
    ]
  );

  const { ref } = useCanvas({
    height,
    draw,
    init: initCursor,
  });

  const renderTooltip = useCallback(() => {
    if (hoveredId === undefined || !data[hoveredId]) {
      return;
    }
    return <ItemTooltip item={data[hoveredId].item} />;
  }, [data, hoveredId]);

  return (
    <MouseTooltip isOpen={hoveredId !== undefined} render={renderTooltip}>
      <canvas
        ref={ref}
        className="w-full"
        style={{ height }}
        data-rv-plot="valueUncertainty"
        onClick={() => {
          if (hoveredId !== undefined && data[hoveredId]) {
            onItemClick(data[hoveredId].item);
          }
        }}
      />
    </MouseTooltip>
  );
};
