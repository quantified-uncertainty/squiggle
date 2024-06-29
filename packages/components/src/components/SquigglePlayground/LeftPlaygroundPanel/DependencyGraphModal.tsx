import "reactflow/dist/style.css";

import Dagre from "@dagrejs/dagre";
import { FC, useMemo } from "react";
import { type Edge, type Node, ReactFlow } from "reactflow";

import { SqProject } from "@quri/squiggle-lang";

export const DependencyGraphModal: FC<{
  project: SqProject;
}> = ({ project }) => {
  // const sourceIds = project.getSourceIds();

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
        id: `${headId}->${head}`,
        source: headId,
        target: `unresolved:${head}`,
      });
    }
    for (const [id, module] of project.state.unresolvedModules) {
      nodes.push({
        id: `unresolved:${id}`,
        className: "!bg-red-300",
        position: { x: 0, y: 0 },
        width: 200,
        height: 100,
        data: { label: module.name },
      });
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
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesConnectable={false}
        nodesDraggable={false}
      />
    </div>
  );
};
