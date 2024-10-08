import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

export const WorkflowName: FC<{ workflow: ClientWorkflow }> = ({
  workflow,
}) => {
  return "prompt" in workflow.inputs &&
    workflow.inputs["prompt"].kind === "prompt"
    ? workflow.inputs["prompt"].value
    : workflow.id;
};
