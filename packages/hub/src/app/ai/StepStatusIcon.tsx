import { FC } from "react";

import { SerializedStep } from "@quri/squiggle-ai";
import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

export const StepStatusIcon: FC<{ step: SerializedStep }> = ({ step }) => {
  switch (step.state) {
    case "PENDING":
      return <RefreshIcon className="animate-spin text-gray-400" />;
    case "DONE":
      return <CheckCircleIcon className="text-gray-400" />;
    case "FAILED":
      return <ErrorIcon className="text-red-500" />;
    default:
      return null;
  }
};
