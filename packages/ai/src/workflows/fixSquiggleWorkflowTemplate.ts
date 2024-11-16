import { PromptArtifact } from "../Artifact.js";
import { runAndFormatCodeStep } from "../steps/runAndFormatCodeStep.js";
import { fixAdjustRetryLoop } from "./controllers.js";
import { WorkflowTemplate } from "./WorkflowTemplate.js";

export const fixSquiggleWorkflowTemplate = new WorkflowTemplate<{
  inputs: {
    source: "source";
  };
  outputs: Record<string, never>;
}>({
  name: "FixSquiggle",
  getInitialStep: (workflow) =>
    runAndFormatCodeStep.prepare({ source: workflow.inputs.source }),
  getTransitionRule: (workflow) => {
    // TODO - cache the prompt artifact once? maybe even as a global variable
    // (but it's better to just refactor steps to make the prompt optional, somehow)
    return fixAdjustRetryLoop(workflow, new PromptArtifact(""));
  },
});
