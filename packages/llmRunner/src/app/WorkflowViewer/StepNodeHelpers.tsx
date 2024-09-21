import clsx from "clsx";
import { FC } from "react";

import { CodeBracketIcon, CommentIcon, Tooltip } from "@quri/ui";

import {
  ArtifactDescription,
  MessageDescription,
} from "../utils/squiggleTypes";

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
  <div className="space-y-4 text-sm">
    {messages.map((message, index) => (
      <div
        key={index}
        className={clsx(
          "rounded-lg p-3 shadow-sm",
          message.role === "user" ? "bg-blue-50" : "bg-green-50"
        )}
      >
        <header className="mb-1 flex items-center">
          <span
            className={clsx(
              "mr-2 rounded-full px-2 py-1 text-xs font-semibold",
              message.role === "user"
                ? "bg-blue-200 text-blue-800"
                : "bg-green-200 text-green-800"
            )}
          >
            {message.role === "user" ? "User" : "Assistant"}
          </span>
        </header>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    ))}
  </div>
);