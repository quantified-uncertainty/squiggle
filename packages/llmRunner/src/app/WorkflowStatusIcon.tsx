import { FC } from "react";

import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

import { WorkflowDescription } from "./utils/squiggleTypes";

export const WorkflowStatusIcon: FC<{ workflow: WorkflowDescription }> = ({
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
