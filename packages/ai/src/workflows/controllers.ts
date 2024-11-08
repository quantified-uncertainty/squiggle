import { Artifact, CodeArtifact, PromptArtifact } from "../Artifact.js";
import { IOShape } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { matchStyleGuideStep } from "../steps/matchStyleGuideStep.js";
import { Workflow } from "./Workflow.js";

function handleCodeStep(
  workflow: Workflow<any>,
  prompt: PromptArtifact,
  code: CodeArtifact | undefined,
  currentStepType: typeof adjustToFeedbackStep | typeof matchStyleGuideStep,
  nextStepType: typeof matchStyleGuideStep | undefined
) {
  // This means the step is done.
  if (!code) {
    if (nextStepType) {
      const recentCode = workflow.getRecentValidCode();
      if (!recentCode) {
        throw new Error(
          "Impossible state. Some code must have existed before."
        );
      }
      workflow.addStep(nextStepType, { prompt, code: recentCode });
    }
    // else, is done with run
    return;
  }

  if (code.value.type !== "success") {
    workflow.addStep(fixCodeUntilItRunsStep, { code });
  } else {
    workflow.addStep(currentStepType, { prompt, code });
  }
}

function handleSuccessfulCode(
  workflow: Workflow<any>,
  prompt: PromptArtifact,
  code: CodeArtifact,
  nextStep: typeof adjustToFeedbackStep
) {
  console.log("Handling successful code");
  if (code.value.type !== "success") {
    workflow.addStep(fixCodeUntilItRunsStep, { code });
  } else {
    workflow.addStep(nextStep, { prompt, code });
  }
}

export function fixAdjustRetryLoop<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  workflow.addEventListener("stepFinished", ({ data: { step } }) => {
    const codeArtifact = step.getOutputs()["code"] as Artifact | undefined;
    if (codeArtifact && codeArtifact.kind !== "code") {
      throw new Error("Impossible state");
    }
    const code = codeArtifact?.kind === "code" ? codeArtifact : undefined;

    const state = step.getState();

    if (state.kind === "FAILED") {
      if (state.errorType === "MINOR") {
        workflow.addRetryOfPreviousStep();
      }
      return true;
    }

    const templateName = workflow.currentStepTemplateName();

    switch (templateName) {
      case undefined:
        return;
      case "GenerateCode": {
        if (!code) {
          throw new Error("Impossible state");
        }
        handleSuccessfulCode(workflow, prompt, code, adjustToFeedbackStep);
        break;
      }
      case "FixCodeUntilItRuns":
        if (!code) {
          throw new Error("Impossible state");
        }
        handleSuccessfulCode(workflow, prompt, code, adjustToFeedbackStep);
        break;
      case "AdjustToFeedback":
        handleCodeStep(
          workflow,
          prompt,
          code,
          adjustToFeedbackStep,
          matchStyleGuideStep
        );
        break;
      case "MatchStyleGuide":
        handleCodeStep(workflow, prompt, code, matchStyleGuideStep, undefined);
        break;
      default:
        throw new Error(`Unknown step template name: ${templateName}`);
    }
  });
}
