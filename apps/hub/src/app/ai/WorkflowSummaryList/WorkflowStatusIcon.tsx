import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";
import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

function getWorkflowStatusForIcon(
  workflow: ClientWorkflow
): ClientWorkflow["status"] {
  const ageInSeconds = (new Date().getTime() - workflow.timestamp) / 1000;
  const maxLoadingAge = 300;

  if (workflow.status === "loading") {
    return ageInSeconds < maxLoadingAge ? "loading" : "error";
  }

  if (workflow.status === "finished" && !workflow.result.isValid) {
    return "error";
  }

  return workflow.status;
}

export const WorkflowStatusIcon: FC<{ workflow: ClientWorkflow }> = ({
  workflow,
}) => {
  const status = getWorkflowStatusForIcon(workflow);

  switch (status) {
    case "loading":
      return <RefreshIcon className="animate-spin text-gray-500" size={16} />;
    case "finished":
      return <CheckCircleIcon className="text-emerald-400" size={16} />;
    case "error":
      return <ErrorIcon className="text-red-400" size={16} />;
  }
};
