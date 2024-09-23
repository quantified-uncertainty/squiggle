import clsx from "clsx";
import { FC } from "react";

import { SerializedMessage } from "@quri/squiggle-ai";

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
