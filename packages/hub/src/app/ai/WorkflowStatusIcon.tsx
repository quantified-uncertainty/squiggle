import { FC } from "react";

import { SerializedWorkflow } from "@quri/squiggle-ai";
import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

export const WorkflowStatusIcon: FC<{ workflow: SerializedWorkflow }> = ({
  workflow,
}) => {
  switch (workflow.status) {
    case "loading":
      return <RefreshIcon className="animate-spin text-gray-500" />;
    case "finished":
      return workflow.result.isValid ? (
        <CheckCircleIcon className="text-emerald-500" />
      ) : (
        <ErrorIcon className="text-red-500" />
      );
    case "error":
      return <ErrorIcon className="text-red-500" />;
  }
};
