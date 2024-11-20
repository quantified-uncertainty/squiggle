import { FC } from "react";

import { ClientStep } from "@quri/squiggle-ai";
import { CheckCircleIcon, ErrorIcon, RefreshIcon, TextTooltip } from "@quri/ui";

export const StepStatusIcon: FC<{ step: ClientStep }> = ({ step }) => {
  switch (step.state.kind) {
    case "PENDING":
      return <RefreshIcon className="animate-spin text-gray-400" size={16} />;
    case "DONE":
      return <CheckCircleIcon className="text-gray-400" size={16} />;
    case "FAILED": {
      const { message } = step.state;
      return (
        <TextTooltip text={message}>
          <div>
            <ErrorIcon className="text-red-300" size={16} />
          </div>
        </TextTooltip>
      );
    }
    default:
      return null;
  }
};
