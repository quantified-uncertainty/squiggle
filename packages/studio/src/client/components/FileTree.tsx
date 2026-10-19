import { clsx } from "clsx";
import { FC, useState } from "react";

import { ChevronDownIcon, ChevronRightIcon } from "@quri/ui";

import type { TreeNode } from "../../shared/api.js";
import { FileIcon, FolderIcon, SquiggleIcon } from "./icons.js";

type Props = {
  nodes: TreeNode[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  onOpen: (path: string) => void;
};

const indent = (depth: number) => ({ paddingLeft: 8 + depth * 14 });

const Node: FC<Omit<Props, "nodes"> & { node: TreeNode; depth: number }> = ({
  node,
  depth,
  activePath,
  dirtyPaths,
  onOpen,
}) => {
  const [expanded, setExpanded] = useState(
    () => depth < 1 || (activePath?.startsWith(node.path + "/") ?? false)
  );

  if (node.type === "dir") {
    return (
      <li>
        <button
          type="button"
          className="flex w-full items-center gap-1 rounded py-0.5 pr-2 text-left text-sm text-slate-600 hover:bg-slate-200/60"
          style={indent(depth)}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDownIcon size={12} className="shrink-0 text-slate-400" />
          ) : (
            <ChevronRightIcon size={12} className="shrink-0 text-slate-400" />
          )}
          <FolderIcon size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && (
          <ul>
            {node.children.map((child) => (
              <Node
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                dirtyPaths={dirtyPaths}
                onOpen={onOpen}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const isActive = node.path === activePath;
  const isSquiggle = node.name.endsWith(".squiggle");
  return (
    <li>
      <button
        type="button"
        title={node.path}
        className={clsx(
          "flex w-full items-center gap-1.5 rounded py-0.5 pr-2 text-left text-sm",
          isActive
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-200/60"
        )}
        style={indent(depth + 1)}
        onClick={() => onOpen(node.path)}
      >
        {isSquiggle ? (
          <SquiggleIcon size={14} className="shrink-0 text-orange-500" />
        ) : (
          <FileIcon size={14} className="shrink-0 text-slate-400" />
        )}
        <span className="truncate">{node.name}</span>
        {dirtyPaths.has(node.path) && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
        )}
      </button>
    </li>
  );
};

export const FileTree: FC<Props> = ({ nodes, ...rest }) => {
  if (!nodes.length) {
    return (
      <div className="px-3 py-2 text-xs text-slate-400">
        No .squiggle, .json or .md files in this folder yet.
      </div>
    );
  }
  return (
    <ul className="py-1">
      {nodes.map((node) => (
        <Node key={node.path} node={node} depth={0} {...rest} />
      ))}
    </ul>
  );
};
