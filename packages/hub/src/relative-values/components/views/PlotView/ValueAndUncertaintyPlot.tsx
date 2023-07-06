import * as d3 from "d3";
import { FC, useCallback, useMemo, useState } from "react";

import {
  DrawContext,
  drawAxes,
  useCanvas,
  useCanvasCursor,
} from "@quri/squiggle-components";
import { MouseTooltip } from "@quri/ui";

import { Item } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import {
  useDefinition,
  useDefinitionClusters,
  useRelativeValuesContext,
} from "../RelativeValuesProvider";
import { useFilteredItems } from "../hooks";
import { averageMedian, averageUncertainty } from "../hooks/useSortedItems";
import { distance } from "./ForcePlot";
import { ItemTooltip } from "./ItemTooltip";
import { d3Extended } from "@quri/squiggle-components";

type Datum = {
  item: Item;
  median: number;
  uncertainty: number;
};

function usePlotData(model: ModelEvaluator) {
  const { items, recommendedUnit } = useDefinition();

  const {
    axisConfig: { rows },
  } = useRelativeValuesContext();

  const filteredItems = useFilteredItems({ items, config: rows });

  const comparedTo = useMemo(() => {
    return recommendedUnit
      ? [items.find((item) => item.id === recommendedUnit) ?? items[0]]
      : items;
  }, [recommendedUnit, items]);

  const data = useMemo(() => {
    const data: Datum[] = [];

    for (const item of filteredItems) {
      data.push({
        item,
        median: averageMedian({ item, comparedTo, model: model }),
        uncertainty: averageUncertainty({ item, comparedTo, model: model }),
      });
    }
    return data;
  }, [filteredItems, model, comparedTo]);
  return { data, comparedToAverage: comparedTo.length > 1 };
}

export const ValueAndUncertaintyPlot: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  const clusters = useDefinitionClusters();

  const { cursor, initCursor } = useCanvasCursor();
  const [hoveredId, setHoveredId] = useState<number | undefined>(undefined);

  const height = 450;
  const { data, comparedToAverage } = usePlotData(model);

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const xScale = d3Extended
        .scaleLog()
        .domain(d3.extent(data, (d) => Math.abs(d.median)) as [number, number]);

      const yScale = d3Extended
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.uncertainty) as [number, number]);

      const { padding, frame } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: { top: 10, bottom: 40, left: 60, right: 20 },
        xScale,
        yScale,
        drawTicks: true,
      });

      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.font = "bold 12px sans-serif";
      context.fillStyle = "rgb(114, 125, 147)"; // copy-paste from drawUtils
      context.fillText(
        comparedToAverage ? "Mean relative value" : "Relative value",
        width - padding.right,
        height
      );

      context.save();
      context.textAlign = "right";
      context.textBaseline = "top";
      context.rotate(-Math.PI / 2);
      context.fillText(
        comparedToAverage
          ? "Mean uncertainty (decibels)"
          : "Uncertainty (decibels)",
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
        const x = xScale(d.median),
          y = yScale(d.uncertainty);
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
          d.item.clusterId && !isHovered
            ? clusters[d.item.clusterId].color
            : "black";
        context.fill();
      }

      context.canvas.style.cursor =
        newHoveredId === undefined ? "auto" : "pointer";
      setHoveredId(newHoveredId);
      context.restore();
    },
    [data, clusters, cursor, comparedToAverage]
  );

  const { ref } = useCanvas({
    height,
    draw,
    init: initCursor,
  });

  const renderTooltip = useCallback(() => {
    if (hoveredId === undefined) {
      return;
    }
    return <ItemTooltip item={data[hoveredId].item} />;
  }, [data, hoveredId]);

  return (
    <MouseTooltip isOpen={hoveredId !== undefined} render={renderTooltip}>
      <canvas ref={ref} className="w-full" />
    </MouseTooltip>
  );
};
