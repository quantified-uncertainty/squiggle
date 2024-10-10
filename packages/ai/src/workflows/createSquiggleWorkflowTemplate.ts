import { generateCodeStep } from "../steps/generateCodeStep.js";
import { WorkflowTemplate } from "./ControlledWorkflow.js";
import { fixAdjustRetryLoop } from "./controllers.js";

/**
 * This is a basic workflow for generating Squiggle code.
 *
 * It generates code based on a prompt, fixes it if necessary, and tries to
 * improve it based on feedback.
 */

export const createSquiggleWorkflowTemplate = new WorkflowTemplate<{
  inputs: {
    prompt: "prompt";
  };
  outputs: Record<string, never>;
}>({
  name: "CreateSquiggle",
  configureControllerLoop(workflow, inputs) {
    fixAdjustRetryLoop(workflow, inputs.prompt);
  },
  configureInitialSteps(workflow, inputs) {
    workflow.addStep(generateCodeStep, { prompt: inputs.prompt });
  },
});
