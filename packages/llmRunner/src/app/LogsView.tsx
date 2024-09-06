"use client";
import { MarkdownViewer } from "@quri/squiggle-components";
import { Button } from "@quri/ui";

import { linkerWithDefaultSquiggleLibs } from "../llmRunner/processSquiggleCode";

export const LogsView: React.FC<{
  onClose: () => void;
  logSummary: string;
}> = ({ onClose, logSummary }) => {
  return (
    <div className="h-full w-full bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Logs</h2>
        <Button theme="alert" onClick={onClose}>
          Close
        </Button>
      </div>
      <MarkdownViewer
        md={logSummary}
        textSize="sm"
        linker={linkerWithDefaultSquiggleLibs}
      />
    </div>
  );
};
