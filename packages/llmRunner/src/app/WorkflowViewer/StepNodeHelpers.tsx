import clsx from "clsx";
import { FC } from "react";
import { type Node } from "reactflow";

import { CodeBracketIcon, CommentIcon, Tooltip } from "@quri/ui";

import {
  ArtifactDescription,
  MessageDescription,
  StepDescription,
} from "../utils/squiggleTypes";

type DagreNode = Omit<Node<StepDescription>, "position"> & {
  width: number;
  height: number;
};

export const ArtifactIcon: FC<{
  artifact: ArtifactDescription;
  size: number;
}> = ({ artifact, size }) => {
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

export const ArtifactDisplay: FC<{
  name: string;
  artifact: ArtifactDescription;
  size: number;
  showArtifactName: boolean;
}> = ({ name, artifact, size, showArtifactName }) => {
  return (
    <Tooltip
      render={() => (
        <div className="max-h-80 max-w-md overflow-y-auto rounded border bg-white px-3 py-2 text-xs shadow-lg">
          <div className="mb-2 text-lg font-bold text-slate-700">{name}</div>
          {artifact.kind === "source" || artifact.kind === "code" ? (
            <pre className="whitespace-pre-wrap">{artifact.value}</pre>
          ) : (
            <div>{artifact.value}</div>
          )}
        </div>
      )}
    >
      <div
        className={clsx(
          "flex cursor-pointer items-center",
          showArtifactName && "gap-1 rounded-full bg-slate-100 px-1 py-0.5"
        )}
      >
        <ArtifactIcon artifact={artifact} size={size} />
        {showArtifactName && (
          <span className="text-sm text-slate-700">{name}</span>
        )}
      </div>
    </Tooltip>
  );
};

export const ArtifactMessages: FC<{ messages: MessageDescription[] }> = ({
  messages,
}) => (
  <div className="space-y-2 text-xs">
    {messages.map((message, index) => (
      <div key={index}>
        <header className="font-bold">{message.role}:</header>
        <pre className="whitespace-pre-wrap">{message.content}</pre>
      </div>
    ))}
  </div>
);
