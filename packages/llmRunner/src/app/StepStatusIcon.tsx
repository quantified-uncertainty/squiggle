import { FC } from "react";

import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

import { StepDescription } from "./utils/squiggleTypes";

export const StepStatusIcon: FC<{ step: StepDescription }> = ({ step }) => {
  switch (step.state) {
    case "PENDING":
      return <RefreshIcon className="animate-spin text-slate-400" />;
    case "DONE":
      return <CheckCircleIcon className="text-slate-300" />;
    case "FAILED":
      return <ErrorIcon className="text-red-500" />;
    default:
      return null;
  }
};
