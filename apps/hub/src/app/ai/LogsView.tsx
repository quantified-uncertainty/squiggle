"use client";
import { FC } from "react";

import { llmLinker } from "@quri/squiggle-ai";
import { MarkdownViewer } from "@quri/squiggle-components";

export const LogsView: FC<{
  logSummary: string;
}> = ({ logSummary }) => {
  return (
    <div className="h-full w-full bg-white p-4">
      <MarkdownViewer
        md={logSummary}
        textSize="sm"
        linker={llmLinker}
        className="max-w-none"
      />
    </div>
  );
};
