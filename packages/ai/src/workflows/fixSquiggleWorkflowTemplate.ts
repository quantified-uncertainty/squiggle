import { PromptArtifact } from "../Artifact.js";
import { runAndFormatCodeStep } from "../steps/runAndFormatCodeStep.js";
import { WorkflowTemplate } from "./ControlledWorkflow.js";
import { fixAdjustRetryLoop } from "./controllers.js";

export const fixSquiggleWorkflowTemplate = new WorkflowTemplate<{
  inputs: {
    source: "source";
  };
  outputs: Record<string, never>;
}>({
  name: "FixSquiggle",
  configureControllerLoop(workflow) {
    // TODO - cache the prompt artifact once? maybe even as a global variable
    // (but it's better to just refactor steps to make the prompt optional, somehow)
    fixAdjustRetryLoop(workflow, new PromptArtifact(""));
  },
  configureInitialSteps(workflow, inputs) {
    workflow.addStep(runAndFormatCodeStep, { source: inputs.source });
  },
});
