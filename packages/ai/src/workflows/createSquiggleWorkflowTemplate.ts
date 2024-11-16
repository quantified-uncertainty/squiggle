import { generateCodeStep } from "../steps/generateCodeStep.js";
import { fixAdjustRetryLoop } from "./controllers.js";
import { WorkflowTemplate } from "./WorkflowTemplate.js";

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
  getTransitionRule: (workflow) =>
    fixAdjustRetryLoop(workflow, workflow.inputs.prompt),
  getInitialStep: (workflow) =>
    generateCodeStep.prepare({ prompt: workflow.inputs.prompt }),
});
