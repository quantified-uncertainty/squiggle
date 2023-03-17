import { FC, useEffect, useMemo, useRef } from "react";

import * as d3 from "d3";
import { useInterfaceContext } from "@/components/Interface/InterfaceProvider";
import { useViewContext } from "../ViewProvider";
import { useCachedPairs, useFilteredItems } from "../hooks";
import { SqLambda } from "@quri/squiggle-lang";

export const ForcePlot: FC<{
  fn: SqLambda;
}> = ({ fn }) => {
  const ref = useRef<SVGGElement>(null);

  const {
    catalog: { items, clusters },
  } = useInterfaceContext();

  const {
    axisConfig: { rows },
  } = useViewContext();

  const filteredItems = useFilteredItems({ items, config: rows });

  type Node = {
    id: string;
    x: number;
    y: number;
    clusterId?: string;
  };

  const nodes: Node[] = useMemo(
    () =>
      filteredItems.map((item) => ({
        id: item.id,
        x: 100,
        y: 100,
        clusterId: item.clusterId,
      })),
    [filteredItems]
  );

  const allPairs = useCachedPairs(fn, items);

  const width = 400;
  const height = 400;
  const margin = { top: 10, bottom: 40, left: 60, right: 20 };

  const d3ref =
    useRef<{
      simulation: d3.Simulation<Node, undefined>;
      force: d3.ForceLink<Node, d3.SimulationLinkDatum<Node>>;
    }>();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    svg
      .append("g")
      .attr("id", "circles")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    const simulation = d3.forceSimulation(nodes);

    const force = d3
      .forceLink<Node, d3.SimulationLinkDatum<Node>>()
      .distance((d) => {
        const cache = allPairs[(d.source as Node).id][(d.target as Node).id];
        if (!cache.ok) {
          return 1e9; // ???
        }
        return cache.value.db * 10;
      });

    simulation.force("link", force);

    d3ref.current = { force, simulation };

    return () => {
      simulation.stop();
    };
  }, [ref.current]);

  useEffect(() => {
    if (!d3ref.current) {
      return;
    }
    const svg = d3.select(ref.current);

    const { simulation, force } = d3ref.current;

    const node = svg
      .select("#circles")
      .selectAll("circle")
      .data(nodes)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("r", 5)
            .attr("fill", (d) =>
              d.clusterId ? clusters[d.clusterId].color : "black"
            ),
        (update) =>
          update.attr("fill", (d) =>
            d.clusterId ? clusters[d.clusterId].color : "black"
          )
      );

    const ticked = () => {
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    };
    simulation.on("tick", ticked);

    const links: { source: Node; target: Node }[] = [];
    for (let i = 0; i < filteredItems.length; i++) {
      for (let j = i + 1; j < filteredItems.length; j++) {
        links.push({
          source: nodes[i],
          target: nodes[j],
        });
      }
    }
    force.links(links);

    simulation.nodes(nodes);
    simulation.restart();
  }, [ref.current, d3ref.current, nodes]);

  return (
    <svg
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
    >
      <g transform={`translate(${margin.left},${margin.top})`} ref={ref} />
    </svg>
  );
};
