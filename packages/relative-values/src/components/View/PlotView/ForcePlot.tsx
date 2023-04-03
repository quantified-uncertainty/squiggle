import { FC, useEffect, useMemo, useRef } from "react";

import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import * as d3 from "d3";
import { useFilteredItems } from "../hooks";
import { useViewContext } from "../ViewProvider";

export const ForcePlot: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  const {
    catalog: { items, clusters },
  } = useSelectedInterface();

  const {
    axisConfig: { rows },
  } = useViewContext();

  const filteredItems = useFilteredItems({ items, config: rows });

  type Node = {
    id: string;
    x: number;
    y: number;
    clusterId?: string;
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

  const width = 480;
  const height = 450;

  const d3ref = useRef<{
    simulation: d3.Simulation<Node, undefined>;
    force: d3.ForceLink<Node, d3.SimulationLinkDatum<Node>>;
  }>();

  const cursorRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
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
          return 450; // 30 decibels; is this a good default?
        }
        return relativeValueResult.value.db * 15;
      });

    simulation.force("link", force);

    simulation.force("weak", d3.forceManyBody().strength(1));

    d3ref.current = { force, simulation };

    return () => {
      simulation.stop();
    };
  }, []);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const canvas = ref.current;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.style.width = `${canvas.clientWidth}px`;
    canvas.style.height = `${canvas.clientHeight}px`;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    context.scale(devicePixelRatio, devicePixelRatio);

    d3.select(context.canvas)
      .on("touchmove", (event) => event.preventDefault())
      .on("pointermove", (e) => {
        cursorRef.current = d3.pointer(e);
      });
  }, [ref.current]);

  useEffect(() => {
    if (!d3ref.current || !ref.current) {
      return;
    }
    const context = ref.current.getContext("2d");
    if (!context) {
      return;
    }

    const { simulation, force } = d3ref.current;

    const distance = (
      p1: { x: number; y: number },
      p2: { x: number; y: number }
    ) => {
      return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    };

    const ticked = () => {
      context.clearRect(0, 0, width, height);
      context.save();

      context.translate(width / 2, height / 2);
      const r = 5;
      const hoveredNodes: Node[] = [];
      for (const d of nodes) {
        context.beginPath();
        context.moveTo(d.x + r, d.y);
        context.arc(d.x, d.y, r, 0, 2 * Math.PI);

        const isHovered =
          distance(d, {
            x: cursorRef.current[0] - width / 2,
            y: cursorRef.current[1] - height / 2,
          }) <
          r * 1.5;

        if (isHovered) {
          hoveredNodes.push(d);
        }
        context.fillStyle =
          d.clusterId && !isHovered ? clusters[d.clusterId].color : "black";
        context.fill();
      }

      // In theory, ref could be deallocated while tick function is still active.
      // Also, this satisfies Typescript.
      if (ref.current) {
        ref.current.style.cursor = hoveredNodes.length ? "pointer" : "auto";
      }
      for (const d of hoveredNodes) {
        context.beginPath();
        context.font = "12px sans-serif";
        context.fillStyle = "black";
        context.fillText(d.name, d.x - r * 0.8, d.y - r * 1.5);
        context.fill();
      }

      context.restore();
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

  return <canvas width={width} height={height} ref={ref} />;
};
