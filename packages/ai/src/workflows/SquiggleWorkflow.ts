import { z } from "zod";

import { PromptArtifact } from "../Artifact.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { runAndFormatCodeStep } from "../steps/runAndFormatCodeStep.js";
import { squiggleWorkflowInputSchema } from "../types.js";
import { WorkflowTemplate } from "./ControlledWorkflow.js";
import { Workflow } from "./Workflow.js";

export type SquiggleWorkflowInput = z.infer<typeof squiggleWorkflowInputSchema>;

// Shared between create and edit workflows
function fixAdjustRetryLoop(workflow: Workflow, prompt: PromptArtifact) {
  workflow.addEventListener("stepFinished", ({ data: { step } }) => {
    const code = step.getOutputs()["code"];
    const state = step.getState();

    if (state.kind === "FAILED") {
      if (state.errorType === "MINOR") {
        workflow.addRetryOfPreviousStep();
      }
      return true;
    }

    if (code === undefined || code.kind !== "code") return;

    if (code.value.type === "success") {
      workflow.addStep(adjustToFeedbackStep, {
        prompt,
        code,
      });
    } else {
      workflow.addStep(fixCodeUntilItRunsStep, {
        code,
      });
    }
  });
}

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
