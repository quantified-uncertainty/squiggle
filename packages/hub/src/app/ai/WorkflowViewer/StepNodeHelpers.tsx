import clsx from "clsx";
import { FC, ReactNode } from "react";

import { SerializedArtifact, SerializedMessage } from "@quri/squiggle-ai";
import { CodeBracketIcon, CommentIcon, Tooltip } from "@quri/ui";

type ArtifactKind = "source" | "prompt" | "code";
type ArtifactIconSize = number;

function getArtifactColor(artifact: SerializedArtifact): string {
  if (artifact.kind === "code" && !artifact.ok) {
    return "bg-red-300";
  }
  const ARTIFACT_COLORS: Record<ArtifactKind, string> = {
    source: "bg-blue-400",
    prompt: "bg-slate-400",
    code: "bg-emerald-400",
  };
  return ARTIFACT_COLORS[artifact.kind] || ARTIFACT_COLORS.prompt;
}

function getArtifactIcon(kind: ArtifactKind, size: number): ReactNode {
  switch (kind) {
    case "source":
    case "code":
      return <CodeBracketIcon size={size} />;
    case "prompt":
      return <CommentIcon size={size} />;
    default:
      return null;
  }
}

export const ArtifactIcon: FC<{
  artifact: SerializedArtifact;
  size: ArtifactIconSize;
}> = ({ artifact, size }) => {
  const bgColor = getArtifactColor(artifact);

  return (
    <div className={clsx("rounded-full p-0.5 text-white", bgColor)}>
      {getArtifactIcon(artifact.kind, size)}
    </div>
  );
};

export const ArtifactDisplay: FC<{
  name: string;
  artifact: SerializedArtifact;
  size: ArtifactIconSize;
  showArtifactName?: boolean;
}> = ({ name, artifact, size, showArtifactName = false }) => {
  const isCodeOrSource = artifact.kind === "source" || artifact.kind === "code";

  return (
    <Tooltip
      render={() => (
        <div className="max-h-80 max-w-md overflow-y-auto rounded border bg-white px-3 py-2 text-xs shadow-lg">
          <div className="mb-2 text-lg font-bold text-slate-700">{name}</div>
          {isCodeOrSource ? (
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

const Message: FC<{ message: SerializedMessage }> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div
      className={clsx(
        "rounded-lg p-3 shadow-sm",
        isUser ? "bg-blue-50" : "bg-green-50"
      )}
    >
      <header className="mb-1 flex items-center">
        <span
          className={clsx(
            "mr-2 rounded-full px-2 py-1 text-xs font-semibold",
            isUser ? "bg-blue-200 text-blue-800" : "bg-green-200 text-green-800"
          )}
        >
          {isUser ? "User" : "Assistant"}
        </span>
      </header>
      <div className="whitespace-pre-wrap break-words">{message.content}</div>
    </div>
  );
};

export const ArtifactMessages: FC<{ messages: SerializedMessage[] }> = ({
  messages,
}) => (
  <div className="space-y-4 text-sm">
    {messages.map((message, index) => (
      <Message key={index} message={message} />
    ))}
  </div>
);
