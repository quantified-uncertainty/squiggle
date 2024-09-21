import { FC, MouseEvent } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import { StepStatusIcon } from "../StepStatusIcon";
import { StepDescription } from "../utils/squiggleTypes";
import { ArtifactDisplay } from "./StepNodeHelpers";

export const StepNode: FC<
  NodeProps<StepDescription> & {
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  }
> = ({ data, onClick }) => {
  return (
    <div
      className="relative w-64 rounded-lg border bg-white px-4 py-1 shadow-lg transition-colors hover:bg-slate-50"
      onClick={onClick}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      <div className="flex flex-col">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {data.state !== "DONE" && (
              <div className="shrink-0">
                <StepStatusIcon step={data} />
              </div>
            )}
            <div className="text-slate-60 font-mono text-sm font-semibold">
              {data.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(data.outputs).map(([key, value]) => (
              <ArtifactDisplay
                key={key}
                name={key}
                artifact={value}
                size={12}
                showArtifactName={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
