"use client";
import * as d3 from "d3";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "@quri/squiggle-components";
import { MouseTooltip } from "@quri/ui";

import { getParamPercentiles } from "../../../values/ModelEvaluator.js";
import type { Clusters, Item } from "../../../types.js";
import type { RelativeValueResult } from "../../../values/types.js";
import { cssVariable } from "./canvasColors.js";
import { ItemTooltip } from "./ItemTooltip.js";

export const distance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

type Node = d3.SimulationNodeDatum & {
  id: string;
  x: number;
  y: number;
  clusterId: string | null | undefined;
  name: string;
};

/** Items as dots, pulled together by low pairwise uncertainty. */
export const ForcePlot: FC<{
  items: readonly Item[];
  clusters: Clusters;
  compare: (id1: string, id2: string) => RelativeValueResult | undefined;
  height: number;
  selectedItem: string | null;
  onItemClick: (item: Item) => void;
}> = ({ items, clusters, compare, height, selectedItem, onItemClick }) => {
  const { cursor, initCursor } = useCanvasCursor();
  const [hoveredId, setHoveredId] = useState<number | undefined>(undefined);

  const nodes: Node[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        x: 100,
        y: 100,
        clusterId: item.clusterId,
        name: item.name,
      })),
    [items]
  );

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);
      context.save();

      context.translate(width / 2, height / 2);
      const r = 5;
      const accent = cssVariable(
        context.canvas,
        "--squiggle-rv-accent",
        "#334155"
      );
      let newHoveredId: typeof hoveredId;
      for (let i = 0; i < nodes.length; i++) {
        const d = nodes[i];

        context.beginPath();
        context.moveTo(d.x + r, d.y);
        context.arc(d.x, d.y, r, 0, 2 * Math.PI);

        const isHovered =
          cursor &&
          distance(d, {
            x: cursor.x - width / 2,
            y: cursor.y - height / 2,
          }) <
            r * 1.5;

        if (isHovered) {
          newHoveredId = i; // last one wins
        }
        context.fillStyle =
          (!isHovered && d.clusterId && clusters[d.clusterId]?.color) ||
          "black";
        context.fill();
        if (d.id === selectedItem) {
          context.beginPath();
          context.arc(d.x, d.y, r + 3, 0, 2 * Math.PI);
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
    [clusters, nodes, cursor, height, selectedItem]
  );

  const { ref, redraw } = useCanvas({
    height,
    draw,
    init: initCursor,
  });
  const redrawRef = useRef(redraw);
  redrawRef.current = redraw;

  const compareRef = useRef(compare);
  compareRef.current = compare;

  // The simulation runs a timer, so it's created in an effect (never while
  // rendering, e.g. on the server) and stopped on cleanup.
  useEffect(() => {
    //These params were eye-picked to look good
    const expParamater = 0.7;
    const multParameter = 250;

    const diffPercentiles = getParamPercentiles(
      nodes.flatMap((a) =>
        nodes.flatMap((b) => {
          const result = compareRef.current(a.id, b.id);
          return result?.ok ? [result.value] : [];
        })
      ),
      (r) => r.uncertainty,
      [10, 90],
      true
    );
    const expDiff =
      Math.log10(diffPercentiles[1]) - Math.log10(diffPercentiles[0]);
    const forceExp = expParamater / expDiff;
    // Inversely proportional to the 90th percentile uncertainty, to ensure a
    // decent spread.
    const forceMultiplier = multParameter / diffPercentiles[1] ** forceExp;
    const forceFn = (uncertainty: number) =>
      uncertainty ** forceExp * forceMultiplier;

    const simulation = d3.forceSimulation(nodes);
    simulation.alphaTarget(0.5);
    simulation.force("center", d3.forceCenter());

    const force = d3
      .forceLink<Node, d3.SimulationLinkDatum<Node>>()
      .distance((d) => {
        const result = compareRef.current(
          (d.source as Node).id,
          (d.target as Node).id
        );
        if (!result?.ok) {
          return 200; // should eventually be just removed, this is a hack
        }
        return forceFn(result.value.uncertainty);
      });
    simulation.force("link", force);
    simulation.force("weak", d3.forceManyBody().strength(1));

    const links: { source: Node; target: Node }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        links.push({ source: nodes[i], target: nodes[j] });
      }
    }
    force.links(links);
    simulation.nodes(nodes);
    simulation.on("tick", () => redrawRef.current());
    simulation.restart();

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  const hoveredItem = useMemo(() => {
    return hoveredId === undefined ? undefined : items[hoveredId];
  }, [hoveredId, items]);

  const renderTooltip = useCallback(() => {
    if (hoveredItem === undefined) {
      return;
    }
    return <ItemTooltip item={hoveredItem} />;
  }, [hoveredItem]);

  return (
    <MouseTooltip isOpen={hoveredId !== undefined} render={renderTooltip}>
      <canvas
        ref={ref}
        className="w-full"
        style={{ height }}
        data-rv-plot="similarity"
        onClick={() => {
          if (hoveredItem) {
            onItemClick(hoveredItem);
          }
        }}
      />
    </MouseTooltip>
  );
};
