import "reactflow/dist/style.css";

import Dagre from "@dagrejs/dagre";
import { FC, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  MarkerType,
  type Node,
  ReactFlow,
} from "reactflow";

import { SqProject } from "@quri/squiggle-lang";

export const DependencyGraphModal: FC<{
  project: SqProject;
}> = ({ project }) => {
  const { nodes, edges }: { nodes: Node[]; edges: Edge[] } = useMemo(() => {
    const nodes: (Omit<Node, "width" | "height"> & {
      width: number;
      height: number;
    })[] = [];
    const edges: Edge[] = [];

    for (const [headName, head] of project.state.heads) {
      const headId = `head:${headName}`;
      nodes.push({
        id: headId,
        position: { x: 0, y: 0 },
        className: "!bg-green-300",
        width: 200,
        height: 100,
        data: { label: headName },
      });
      edges.push({
        id: `${headId}->${head.hash}`,
        source: headId,
        target: `module:${head.hash}`,
        markerEnd: {
          type: MarkerType.Arrow,
          width: 24,
          height: 24,
        },
      });
    }
    for (const [id, module] of project.state.modules) {
      nodes.push({
        id: `module:${id}`,
        className: "!bg-blue-300",
        position: { x: 0, y: 0 },
        width: 200,
        height: 100,
        data: { label: module.name },
      });

      for (const importBinding of module.imports()) {
        edges.push({
          id: `module:${id}->${importBinding.name}`,
          source: `module:${id}`,
          target: `module:${module.pins[importBinding.name] ?? project.state.resolutions.get(importBinding.name)}`,
          markerEnd: {
            type: MarkerType.Arrow,
            width: 24,
            height: 24,
          },
        });
      }
    }

    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

    g.setGraph({ rankdir: "TB" });

    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node) => g.setNode(node.id, node));

    Dagre.layout(g);

    return {
      nodes: nodes.map((node) => {
        const position = g.node(node.id);
        const x = position.x - node.width / 2;
        const y = position.y - node.height / 2;

        return { ...node, position: { x, y } };
      }),
      edges,
    };
  }, [project.state]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="pb-2 text-xs">
        {project.state.heads.size} heads, {project.state.modules.size} modules,{" "}
        {project.state.outputs.size} outputs
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesConnectable={false}
          nodesDraggable={false}
        >
          <Background color="#eee" variant={BackgroundVariant.Cross} />
        </ReactFlow>
      </div>
    </div>
  );
};
