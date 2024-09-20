import Dagre from "@dagrejs/dagre";
import { FC, useMemo } from "react";
import ReactFlow, { type Edge, MarkerType, type Node } from "reactflow";

import { StepDescription, WorkflowDescription } from "../utils/squiggleTypes";
import { StepNode } from "./StepNode";

type DagreNode = Omit<Node<StepDescription>, "position"> & {
  width: number;
  height: number;
};

type DagreEdge = Edge & { minlen?: number };

function makeNode(step: StepDescription): DagreNode {
  return {
    id: step.id,
    type: "step",
    data: step,
    width: 300,
    height: 80,
  };
}

function makeEdge(
  source: string,
  target: string,
  opts: { minlen?: number } = {}
): DagreEdge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    minlen: opts.minlen,
    type: "smoothstep",
    // Remove inline styles as they're now in the global CSS
  };
}

function layoutGraph(
  dagreNodes: DagreNode[],
  dagreEdges: DagreEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 18, nodesep: 50, edgesep: 10 });
  dagreNodes.forEach((node) => g.setNode(node.id, node));
  dagreEdges.forEach((edge) =>
    g.setEdge(edge.source, edge.target, { minlen: edge.minlen ?? 2 })
  );
  Dagre.layout(g);
  const nodes = dagreNodes.map((node) => {
    const position = g.node(node.id);
    const x = position.x - node.width / 2;
    const y = position.y - node.height / 2;
    return { ...node, position: { x, y } };
  });
  const edges = dagreEdges.map(({ minlen: _, ...edge }) => edge);
  return { nodes, edges };
}

export const WorkflowGraph: FC<{
  workflow: WorkflowDescription;
  height: number;
}> = ({ workflow, height }) => {
  const { nodes, edges }: { nodes: Node[]; edges: Edge[] } = useMemo(() => {
    const nodes: DagreNode[] = [];
    const edges: DagreEdge[] = [];
    for (const step of workflow.steps) {
      nodes.push(makeNode(step));
      for (const input of Object.values(step.inputs)) {
        if (input.createdBy) {
          edges.push(makeEdge(input.createdBy, step.id));
        }
      }
    }
    return layoutGraph(nodes, edges);
  }, [workflow.steps]);

  return (
    <>
      <style jsx global>{`
        .react-flow__handle {
          opacity: 0;
        }
        .react-flow__edge-path {
          stroke: #cbd5e1; /* Tailwind slate-300 */
          stroke-width: 2;
        }
        .react-flow__edge-path:hover {
          stroke: #94a3b8; /* Tailwind slate-400 */
        }
      `}</style>
      <div style={{ height }} className="overflow-hidden rounded-lg shadow-lg">
        <div className="flex h-full w-full flex-col bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodesConnectable={false}
            nodesDraggable={false}
            nodeTypes={{
              step: StepNode,
            }}
            defaultEdgeOptions={{
              type: "smoothstep",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#cbd5e1", // Tailwind slate-300
                width: 10,
                height: 10,
              },
            }}
          />
        </div>
      </div>
    </>
  );
};
