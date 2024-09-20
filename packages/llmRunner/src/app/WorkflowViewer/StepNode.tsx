import clsx from "clsx";
import { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import {
  CodeBracketIcon,
  CommentIcon,
  DocumentTextIcon,
  Tooltip,
} from "@quri/ui";

import { StepStatusIcon } from "../StepStatusIcon";
import {
  ArtifactDescription,
  MessageDescription,
  StepDescription,
} from "../utils/squiggleTypes";

const ArtifactIcon: FC<{ artifact: ArtifactDescription; size: number }> = ({
  artifact,
  size,
}) => {
  const getBgColor = () => {
    switch (artifact.kind) {
      case "source":
        return "bg-blue-400";
      case "prompt":
        return "bg-slate-400";
      case "code":
        return artifact.ok ? "bg-emerald-400" : "bg-red-300";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className={clsx("rounded-full p-0.5 text-white", getBgColor())}>
      {(() => {
        switch (artifact.kind) {
          case "source":
            return <CodeBracketIcon size={size} />;
          case "prompt":
            return <CommentIcon size={size} />;
          case "code":
            return <CodeBracketIcon size={size} />;
          default:
            return <div>❓ {artifact satisfies never}</div>;
        }
      })()}
    </div>
  );
};

const ArtifactDisplay: FC<{
  name: string;
  artifact: ArtifactDescription;
  size: number;
}> = ({ name, artifact, size }) => {
  return (
    <Tooltip
      render={() => {
        return (
          <div className="max-h-80 max-w-md overflow-y-auto rounded border bg-white px-3 py-2 text-xs shadow-lg">
            <div className="mb-2 text-lg font-bold text-slate-700">{name}</div>
            {artifact.kind === "source" || artifact.kind === "code" ? (
              <pre className="whitespace-pre-wrap">{artifact.value}</pre>
            ) : (
              <div>{artifact.value}</div>
            )}
          </div>
        );
      }}
    >
      <div
        className={clsx(
          "rounded-full text-gray-400 hover:bg-slate-100 hover:text-gray-700",
          size === 8 ? "text-xs" : "text-base"
        )}
      >
        <ArtifactIcon artifact={artifact} size={size} />
      </div>
    </Tooltip>
  );
};

const MessagesTooltip: FC<{ messages: MessageDescription[] }> = ({
  messages,
}) => {
  return (
    <Tooltip
      render={() => {
        return (
          <div className="max-h-80 max-w-md overflow-y-auto rounded border bg-white px-3 py-2 text-xs shadow-lg">
            <div className="space-y-2">
              {messages.map((message, index) => {
                return (
                  <div key={index}>
                    <header className="font-bold">{message.role}:</header>
                    <pre className="whitespace-pre-wrap">{message.content}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    >
      <div className="p-0.5 text-gray-400 hover:bg-slate-100 hover:text-gray-700">
        <DocumentTextIcon size={14} />
      </div>
    </Tooltip>
  );
};

export const StepNode: FC<NodeProps<StepDescription>> = ({ data }) => {
  return (
    <div className="relative w-56 rounded-lg border bg-white px-4 py-1 shadow-lg">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      <div className="flex flex-col">
        <div className="mb-1 flex items-center gap-1">
          {data.state !== "DONE" && (
            <div className="shrink-0">
              <StepStatusIcon step={data} />
            </div>
          )}
          <div className="font-mono text-xs font-semibold text-slate-700">
            {data.name}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-9 text-xs font-medium text-slate-400">In:</div>
          {Object.entries(data.inputs).map(([key, value]) => (
            <ArtifactDisplay key={key} name={key} artifact={value} size={7} />
          ))}
        </div>

        {Object.keys(data.outputs).length || data.messages.length ? (
          <div className="mt-1 flex items-center justify-between">
            {Object.keys(data.outputs).length ? (
              <div className="flex items-center gap-2">
                <div className="w-8 text-sm font-medium text-slate-400">
                  Out:
                </div>
                {Object.entries(data.outputs).map(([key, value]) => (
                  <ArtifactDisplay
                    key={key}
                    name={key}
                    artifact={value}
                    size={12}
                  />
                ))}
              </div>
            ) : (
              <div />
            )}
            {data.messages.length ? (
              <MessagesTooltip messages={data.messages} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
