import { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import { CodeBracketIcon, EditIcon, Tooltip } from "@quri/ui";

import { StepStatusIcon } from "../StepStatusIcon";
import { ArtifactDescription, StepDescription } from "../utils/squiggleTypes";

const ArtifactDisplay: FC<{ name: string; artifact: ArtifactDescription }> = ({
  name,
  artifact,
}) => {
  return (
    <Tooltip
      render={() => {
        return (
          <div className="max-h-80 max-w-md overflow-y-auto rounded border bg-white px-3 py-2 text-xs shadow-lg">
            <div className="mb-1 font-medium">{name}</div>
            {artifact.kind === "code" ? (
              <pre className="whitespace-pre-wrap">{artifact.value}</pre>
            ) : (
              <div>{artifact.value}</div>
            )}
          </div>
        );
      }}
    >
      <div className="p-0.5 text-gray-400 hover:bg-slate-100 hover:text-gray-700">
        {artifact.kind === "code" ? (
          <CodeBracketIcon size={14} />
        ) : (
          <EditIcon size={14} />
        )}
      </div>
    </Tooltip>
  );
};

export const StepNode: FC<NodeProps<StepDescription>> = ({ data }) => {
  return (
    <div className="relative w-56 rounded border border-slate-800 bg-white p-2.5">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <div className="text-xs font-medium text-slate-700">In:</div>
          {Object.entries(data.inputs).map(([key, value]) => (
            <ArtifactDisplay key={key} name={key} artifact={value} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <div className="shrink-0">
            <StepStatusIcon step={data} />
          </div>
          <div className="text-sm text-slate-700">{data.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-xs font-medium text-slate-700">Out:</div>
          {Object.entries(data.outputs).map(([key, value]) => (
            <ArtifactDisplay key={key} name={key} artifact={value} />
          ))}
        </div>
      </div>
    </div>
  );
};