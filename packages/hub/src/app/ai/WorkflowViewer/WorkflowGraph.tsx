import Dagre from "@dagrejs/dagre";
import { FC, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Edge,
  MarkerType,
  type Node,
} from "reactflow";

import { SerializedStep, SerializedWorkflow } from "@quri/squiggle-ai";

import { StepNode } from "./StepNode";

type DagreNode = Omit<
  Node<SerializedStep>,
  "position" // position will be overwritten by Dagre
> & { width: number; height: number }; // width and height are required by Dagre

type DagreEdge = Edge & { minlen?: number };

function makeNode(step: SerializedStep): DagreNode {
  return {
    id: step.id,
    type: "step",
    data: step,
    width: 200,
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
    markerEnd: {
      type: MarkerType.Arrow,
      width: 24,
      height: 24,
    },
  };
}

function layoutGraph(
  dagreNodes: DagreNode[],
  dagreEdges: DagreEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({ rankdir: "TB", ranksep: 20 });

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
  workflow: SerializedWorkflow;
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
    <div style={{ height }}>
      <div className="flex h-full w-full flex-col">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesConnectable={false}
          nodesDraggable={false}
          nodeTypes={{
            step: StepNode,
          }}
        >
          <Background color="#eee" variant={BackgroundVariant.Cross} />
        </ReactFlow>
      </div>
    </div>
  );
};
