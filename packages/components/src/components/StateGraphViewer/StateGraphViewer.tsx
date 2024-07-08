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
import { ErrorIcon, RefreshIcon } from "@quri/ui";

import { ActionLog } from "./ActionLog.js";
import { CustomEdge } from "./CustomEdge.js";
import { NodeLabel } from "./NodeLabel.js";
import { StateStats } from "./StateStats.js";

function useNodesAndEdges(project: SqProject) {
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
        data: { label: <NodeLabel type="Head">{headName}</NodeLabel> },
      });
      edges.push({
        id: `head:${headId}->${head.hash}`,
        source: headId,
        target: `module:${head.hash}`,
        markerEnd: {
          type: MarkerType.Arrow,
          width: 24,
          height: 24,
        },
      });
    }
    for (const [id, moduleData] of project.state.modules) {
      switch (moduleData.type) {
        case "failed":
          nodes.push({
            id: `module:${id}`,
            className: "!bg-red-300",
            position: { x: 0, y: 0 },
            width: 200,
            height: 100,
            data: { label: `FAILED: ${id}` },
          });
          break;
        case "loading":
          nodes.push({
            id: `module:${id}`,
            className: "!bg-blue-300",
            position: { x: 0, y: 0 },
            width: 200,
            height: 100,
            data: {
              label: (
                <div>
                  <RefreshIcon className="animate-spin" />
                </div>
              ),
            },
          });
          break;
        case "loaded": {
          const module = moduleData.value;

          nodes.push({
            id: `module:${id}`,
            className: "!bg-blue-300",
            position: { x: 0, y: 0 },
            width: 200,
            height: 100,
            data: {
              label: (
                <NodeLabel type="Module" hash={id}>
                  {module.name}
                </NodeLabel>
              ),
            },
          });

          for (const importBinding of module.getImports(project.state.linker)) {
            const target = project.state.getModuleDataByPointer({
              name: importBinding.name,
              hash: importBinding.hash,
            });

            // there are several possible scenarios here:
            // 1. target is loaded, so we can add an edge to its module node (doesn't matter if it's pinned or not)
            // 2. target is not loaded but pinned, so we add an edge to its loading module node
            // 3. target is not loaded and not pinned, so we add an edge to its pending resolution
            if (target?.type !== "loaded" && !importBinding.hash) {
              edges.push({
                id: `import:${id}->resolution:${importBinding.name}`,
                source: `module:${id}`,
                target: `resolution:${importBinding.name}`,
                markerEnd: {
                  type: MarkerType.Arrow,
                  width: 24,
                  height: 24,
                },
              });
            } else {
              const targetId = importBinding.hash;
              edges.push({
                id: `import:${id}->module:${targetId}`,
                source: `module:${id}`,
                target: `module:${targetId}`,
                markerEnd: {
                  type: MarkerType.Arrow,
                  width: 24,
                  height: 24,
                },
              });
            }
          }
          break;
        }
        default:
          throw moduleData satisfies never;
      }
    }

    for (const [id, resolution] of project.state.resolutions) {
      if (resolution.type === "loaded") {
        continue; // loaded resolutions are not very useful, we connect import edges directly to modules
      }
      nodes.push({
        id: `resolution:${id}`,
        className: "!bg-slate-300",
        position: { x: 0, y: 0 },
        width: 200,
        height: 100,
        data: {
          label: (
            <NodeLabel type="Module">
              <div className="flex">
                <div>{id}</div>
                {resolution.type === "loading" && (
                  <RefreshIcon className="animate-spin" />
                )}
                {resolution.type === "failed" && (
                  <ErrorIcon className="text-red-500" />
                )}
              </div>
            </NodeLabel>
          ),
        },
      });
    }

    for (const [id, output] of project.state.outputs) {
      nodes.push({
        id: `output:${id}`,
        className: "!bg-yellow-300",
        position: { x: 0, y: 0 },
        width: 200,
        height: 100,
        data: {
          label: <NodeLabel type="Output" hash={id} />,
        },
      });

      edges.push({
        id: `output:${id}->${output.module.hash()}`,
        source: `module:${output.module.hash()}`,
        target: `output:${id}`,
        markerEnd: {
          type: MarkerType.Arrow,
          width: 24,
          height: 24,
        },
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
  return { nodes, edges };
}

export const StateGraphViewer: FC<{
  project: SqProject;
}> = ({ project }) => {
  const { nodes, edges } = useNodesAndEdges(project);

  return (
    <div className="flex h-full w-full flex-col">
      <StateStats project={project} />
      <ActionLog project={project} />

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesConnectable={false}
          nodesDraggable={false}
          edgeTypes={{
            default: CustomEdge,
          }}
        >
          <Background color="#eee" variant={BackgroundVariant.Cross} />
        </ReactFlow>
      </div>
    </div>
  );
};
