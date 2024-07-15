import clsx from "clsx";
import { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import { Tooltip } from "@quri/ui";

import { NodeData } from "./types.js";

export const CustomNode: FC<NodeProps<NodeData>> = (props) => {
  const body = (
    <div
      className={clsx(
        "w-40 rounded border border-slate-800 p-2.5 text-xs",
        props.data.className
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div>{props.data.label}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
  const tooltip = props.data.tooltip;
  if (tooltip) {
    return (
      <Tooltip
        render={() => (
          <div className="max-w-80 rounded border bg-white px-3 py-2 text-xs shadow-lg">
            {tooltip()}
          </div>
        )}
      >
        {body}
      </Tooltip>
    );
  } else {
    return body;
  }
};
