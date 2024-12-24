import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

export const WorkflowName: FC<{ workflow: ClientWorkflow }> = ({
  workflow,
}) => {
  const { inputs } = workflow;

  if (inputs["prompt"]?.kind === "prompt") return inputs["prompt"].value;
  if (inputs["source"]?.kind === "source") return inputs["source"].value;

  return workflow.id;
};
