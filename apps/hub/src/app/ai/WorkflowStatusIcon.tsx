import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";
import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

export const WorkflowStatusIcon: FC<{ workflow: ClientWorkflow }> = ({
  workflow,
}) => {
  const ageInSeconds = (new Date().getTime() - workflow.timestamp) / 1000;
  const maxLoadingAge = 300;

  switch (workflow.status) {
    case "loading":
      return ageInSeconds < maxLoadingAge ? (
        <RefreshIcon className="animate-spin text-gray-500" size={16} />
      ) : (
        <ErrorIcon className="text-red-400" size={16} />
      );
    case "finished":
      return workflow.result.isValid ? (
        <CheckCircleIcon className="text-emerald-400" size={16} />
      ) : (
        <ErrorIcon className="text-red-400" size={16} />
      );
    case "error":
      return <ErrorIcon className="text-red-400" size={16} />;
  }
};
