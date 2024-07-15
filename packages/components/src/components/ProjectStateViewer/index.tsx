import Dagre from "@dagrejs/dagre";
import { FC, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Edge,
  MarkerType,
  type Node,
  ReactFlow,
} from "reactflow";

import { SqProject } from "@quri/squiggle-lang";
import { CheckIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

import { CodeSyntaxHighlighter } from "../../index.js";
import { InnerViewerProvider } from "../SquiggleViewer/ViewerProvider.js";
import { ViewerBody } from "../ViewerWithMenuBar/ViewerBody.js";
import { ActionLog } from "./ActionLog.js";
import { CustomEdge } from "./CustomEdge.js";
import { CustomNode } from "./CustomNode.js";
import { NodeLabel } from "./NodeLabel.js";
import { StateStats } from "./StateStats.js";
import { NodeData } from "./types.js";

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

function useNodesAndEdges({
  project,
  headTooltips = {},
}: {
  project: SqProject;
  headTooltips?: Record<string, string>;
}) {
  const { nodes, edges }: { nodes: Node[]; edges: Edge[] } = useMemo(() => {
    const nodes: DagreNode[] = [];
    const edges: DagreEdge[] = [];

    for (const [headName, head] of project.state.heads) {
      const headId = `head:${headName}`;
      nodes.push(
        makeNode({
          id: headId,
          className: "!bg-green-300",
          label: <NodeLabel type="Head">{headName}</NodeLabel>,
          tooltip: headTooltips[headName]
            ? () => headTooltips[headName]
            : undefined,
          noTargetHandle: true,
        })
      );
      edges.push(makeEdge(headId, `module:${head.hash}`));
    }
    for (const [id, moduleData] of project.state.modules) {
      switch (moduleData.type) {
        case "failed":
          nodes.push(
            makeNode({
              id: `module:${id}`,
              className: "!bg-red-300",
              label: `FAILED: ${id}`,
            })
          );
          break;
        case "loading":
          nodes.push(
            makeNode({
              id: `module:${id}`,
              className: "!bg-blue-300",
              label: <RefreshIcon className="animate-spin" />,
            })
          );
          break;
        case "loaded": {
          const module = moduleData.value;

          nodes.push(
            makeNode({
              id: `module:${id}`,
              className: "!bg-blue-300",
              label: (
                <NodeLabel type="Module" hash={id}>
                  {module.name}
                </NodeLabel>
              ),
              tooltip: () => (
                <CodeSyntaxHighlighter language="squiggle">
                  {module.code}
                </CodeSyntaxHighlighter>
              ),
            })
          );

          for (const importBinding of module.getImports(project.state.linker)) {
            const target = project.state.getModuleDataByPointer({
              name: importBinding.name,
              hash: importBinding.hash,
            });

            // there are several possible scenarios here:
            // 1. target is loaded, so we can add an edge to its module node (doesn't matter if it's pinned or not)
            // 2. target is not loaded but pinned, so we add an edge to its loading module node
            // 3. target is not loaded and not pinned, so we add an edge to its pending resolution
            if (target?.type === "loaded") {
              edges.push(
                makeEdge(`module:${id}`, `module:${target.value.hash()}`)
              );
            } else {
              if (importBinding.hash) {
                edges.push(
                  makeEdge(`module:${id}`, `module:${importBinding.hash}`)
                );
              } else {
                edges.push(
                  makeEdge(`module:${id}`, `resolution:${importBinding.name}`)
                );
              }
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
      nodes.push(
        makeNode({
          id: `resolution:${id}`,
          className: "!bg-slate-300",
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
        })
      );
    }

    for (const [id, output] of project.state.outputs) {
      nodes.push(
        makeNode({
          id: `output:${id}`,
          className: "!bg-yellow-300",
          label: (
            <NodeLabel type="Output" hash={id}>
              <div className="flex items-center gap-1">
                <div>{output.executionTime}ms</div>
                {output.result.ok ? (
                  <CheckIcon />
                ) : (
                  <ErrorIcon className="text-red-500" />
                )}
              </div>
            </NodeLabel>
          ),
          tooltip: () => (
            <InnerViewerProvider
              partialPlaygroundSettings={{ environment: output.environment }}
              viewerType="tooltip"
              rootValue={undefined}
            >
              <ViewerBody
                viewerTab="Variables"
                outputResult={output.result}
                project={project}
                isSimulating={false}
                playgroundSettings={{ environment: output.environment }}
              />
            </InnerViewerProvider>
          ),
          noSourceHandle: true,
        })
      );

      edges.push(
        makeEdge(`module:${output.module.hash()}`, `output:${id}`, {
          minlen: 1,
        })
      );
    }

    return layoutGraph(nodes, edges);
  }, [headTooltips, project.state]);
  return { nodes, edges };
}

export const ProjectStateViewer: FC<{
  project: SqProject;
  headTooltips?: Record<string, string>;
}> = ({ project, headTooltips = {} }) => {
  const { nodes, edges } = useNodesAndEdges({ project, headTooltips });

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
          nodeTypes={{
            custom: CustomNode,
          }}
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
