import { PromptArtifact } from "../Artifact.js";
import { IOShape } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { Workflow } from "./Workflow.js";

// Shared between create and edit workflows
export function fixAdjustRetryLoop<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
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
