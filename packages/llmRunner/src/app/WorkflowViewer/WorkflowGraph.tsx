import Dagre from "@dagrejs/dagre";
import { FC, ReactNode, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Edge,
  MarkerType,
  type Node,
} from "reactflow";

import { StepStatusIcon } from "../StepStatusIcon";
import { WorkflowDescription } from "../utils/squiggleTypes";

type NodeData = {
  label: ReactNode;
  tooltip?: () => ReactNode;
  className?: string;
  noTargetHandle?: boolean;
  noSourceHandle?: boolean;
};

type DagreNode = Omit<
  Node<NodeData>,
  "position" // position will be overwritten by Dagre
> & { width: number; height: number }; // width and height are required by Dagre

type DagreEdge = Edge & { minlen?: number };

function makeNode({
  id,
  ...data
}: {
  id: string;
} & NodeData): DagreNode {
  return {
    id,
    type: "custom",
    data,
    width: 150,
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
  workflow: WorkflowDescription;
  height: number;
}> = ({ workflow, height }) => {
  const { nodes, edges }: { nodes: Node[]; edges: Edge[] } = useMemo(() => {
    const nodes: DagreNode[] = [];
    const edges: DagreEdge[] = [];

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      nodes.push(
        makeNode({
          id: step.id,
          label: (
            <div className="flex items-center gap-1">
              <StepStatusIcon step={step} />
              <div>{step.name}</div>
            </div>
          ),
        })
      );
      if (i > 0) {
        edges.push(makeEdge(workflow.steps[i - 1].id, step.id));
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
        >
          <Background color="#eee" variant={BackgroundVariant.Cross} />
        </ReactFlow>
      </div>
    </div>
  );
};
