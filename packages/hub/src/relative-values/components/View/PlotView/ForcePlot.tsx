import * as d3 from "d3";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import {
  DrawContext,
  useCanvas,
  useCanvasCursor,
} from "@quri/squiggle-components";
import { MouseTooltip } from "@quri/ui";

import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import {
  useDefinition,
  useDefinitionClusters,
  useRelativeValuesContext,
} from "../RelativeValuesProvider";
import { useFilteredItems } from "../hooks";
import { ItemTooltip } from "./ItemTooltip";

export const distance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

export const ForcePlot: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  const height = 450;

  const { cursor, initCursor } = useCanvasCursor();

  const { items } = useDefinition();
  const clusters = useDefinitionClusters();

  const {
    axisConfig: { rows },
  } = useRelativeValuesContext();

  const filteredItems = useFilteredItems({ items, config: rows });

  const [hoveredId, setHoveredId] = useState<number | undefined>(undefined);

  type Node = {
    id: string;
    x: number;
    y: number;
    clusterId: string | null;
    name: string;
  };

  const nodes: Node[] = useMemo(
    () =>
      filteredItems.map((item) => ({
        id: item.id,
        x: 100,
        y: 100,
        clusterId: item.clusterId,
        name: item.name,
      })),
    [filteredItems]
  );

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);
      context.save();

      context.translate(width / 2, height / 2);
      const r = 5;
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
          d.clusterId && !isHovered ? clusters[d.clusterId].color : "black";
        context.fill();
      }
      // TODO - force render only if id has changed

      context.canvas.style.cursor =
        newHoveredId === undefined ? "auto" : "pointer";

      setHoveredId(newHoveredId);

      context.restore();
    },
    [clusters, nodes, cursor]
  );

  const { ref, redraw } = useCanvas({
    height,
    draw,
    init: initCursor,
  });

  function getforceFn() {
    //These params were eye-picked to look good
    const expParamater = 0.7;
    const multParameter = 250;

    const diffPercentiles = model.getParamPercentiles(
      filteredItems.map((item) => item.id),
      (r) => r.uncertainty,
      [10, 90],
      true
    );

    const expDiff =
      Math.log10(diffPercentiles[1]) - Math.log10(diffPercentiles[0]);

    const forceExp = expParamater / expDiff;

    // ForceMultiplier is inversetly proportional to the 90th percentile uncertainty, to ensure a decent spread
    const forceMultiplier = multParameter / diffPercentiles[1] ** forceExp;

    return (uncertainty: number) => uncertainty ** forceExp * forceMultiplier;
  }

  const forceFn = getforceFn();

  const simulation = useMemo(() => {
    const simulation = d3.forceSimulation(nodes);

    simulation.alphaTarget(0.5);

    simulation.force("center", d3.forceCenter());

    const force = d3
      .forceLink<Node, d3.SimulationLinkDatum<Node>>()
      .distance((d) => {
        const relativeValueResult = model.compare(
          (d.source as Node).id,
          (d.target as Node).id
        );
        if (!relativeValueResult.ok) {
          return 200; // should eventually be just removed, this is a hack
        }
        return forceFn(relativeValueResult.value.uncertainty);
      });

    simulation.force("link", force);

    simulation.force("weak", d3.forceManyBody().strength(1));

    const links: { source: Node; target: Node }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        links.push({
          source: nodes[i],
          target: nodes[j],
        });
      }
    }
    force.links(links);
    simulation.nodes(nodes);

    return simulation;
  }, [model, nodes]);

  useEffect(() => {
    return () => {
      simulation.stop();
    };
  }, [simulation]);

  useEffect(() => {
    simulation.on("tick", redraw);
    simulation.restart();
  }, [simulation, redraw]);

  const hoveredItem = useMemo(() => {
    return hoveredId === undefined ? undefined : filteredItems[hoveredId];
  }, [hoveredId, filteredItems]);

  const renderTooltip = useCallback(() => {
    if (hoveredItem === undefined) {
      return;
    }
    return <ItemTooltip item={hoveredItem} />;
  }, [hoveredItem]);

  return (
    <MouseTooltip isOpen={hoveredId !== undefined} render={renderTooltip}>
      <canvas ref={ref} className="w-full" />
    </MouseTooltip>
  );
};
