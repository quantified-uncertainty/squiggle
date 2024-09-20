"use client";
import { FC } from "react";

import { llmLinker } from "@quri/squiggle-ai";
import { MarkdownViewer } from "@quri/squiggle-components";

export const LogsView: FC<{
  logSummary: string;
}> = ({ logSummary }) => {
  return (
    <div className="h-full w-full bg-white p-4">
      <h2 className="text-xl font-bold">Logs</h2>
      <MarkdownViewer md={logSummary} textSize="sm" linker={llmLinker} />
    </div>
  );
};
