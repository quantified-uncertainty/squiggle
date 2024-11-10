import { CodeArtifact, PromptArtifact } from "../Artifact.js";
import { LLMStepInstance } from "../LLMStepInstance.js";
import { IOShape } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { matchStyleGuideStep } from "../steps/matchStyleGuideStep.js";
import { Workflow } from "./Workflow.js";
import {
  NextStepAction,
  WorkflowGuardHelpers,
} from "./WorkflowGuardHelpers.js";

const MAX_MINOR_ERRORS = 5;
const MAX_ADJUST_TO_FEEDBACK_RUNS = 3;
const MAX_MATCH_STYLE_GUIDE_RUNS = 2;

// Error Messages
const ERROR_MESSAGES = {
  FAILED_STEP: (stepName: string, errorType: string) =>
    `Step ${stepName} failed with error type ${errorType}`,
  NOT_DONE: (stepName: string, state: string) =>
    `Impossible, step ${stepName} is not done: ${state}`,
  NO_CODE: "Impossible state, generate didn't return code",
  UNKNOWN_STEP: "Unknown step",
};

function getNextIntendedState<Shape extends IOShape>(
  h: WorkflowGuardHelpers<Shape>,
  intendedStep: "AdjustToFeedback" | "MatchStyleGuide",
  prompt: PromptArtifact,
  code: CodeArtifact
): NextStepAction {
  const nextSteps = [
    // Only check AdjustToFeedback if it's intended and has runs remaining
    intendedStep === "AdjustToFeedback" &&
    h.totalRepeats(adjustToFeedbackStep) <= MAX_ADJUST_TO_FEEDBACK_RUNS
      ? h.step(adjustToFeedbackStep, { prompt, code })
      : null,
    // Always check MatchStyleGuide
    h.totalRepeats(matchStyleGuideStep) <= MAX_MATCH_STYLE_GUIDE_RUNS
      ? h.step(matchStyleGuideStep, { prompt, code })
      : null,
  ].filter((r) => !!r);

  return nextSteps.length ? nextSteps[0] : h.finish();
}

// Helper function to handle failed states
function handleFailedState<Shape extends IOShape>(
  step: LLMStepInstance<IOShape, Shape>,
  h: WorkflowGuardHelpers<Shape>
): NextStepAction | undefined {
  const state = step.getState();

  if (state.kind === "FAILED") {
    if (state.errorType === "MINOR") {
      if (h.recentFailedRepeats(fixCodeUntilItRunsStep) > MAX_MINOR_ERRORS) {
        return h.finish(); // Give up after max minor errors
      }
      return h.repeat();
    }

    return h.fatal(
      ERROR_MESSAGES.FAILED_STEP(step.template.name, state.errorType)
    );
  }

  if (state.kind !== "DONE") {
    return h.fatal(ERROR_MESSAGES.NOT_DONE(step.template.name, state.kind));
  }

  return undefined;
}

export function fixAdjustRetryLoop<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  workflow.addLinearRule((step, h) => {
    // process bad states
    const failedState = handleFailedState(step, h);
    if (failedState) return failedState;

    function fixCodeOrAdjustToFeedback(
      code: CodeArtifact | undefined
    ): NextStepAction {
      if (!code) {
        return h.fatal(ERROR_MESSAGES.NO_CODE);
      }
      if (code.value.type !== "success") {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
      return getNextIntendedState(h, "AdjustToFeedback", prompt, code);
    }

    // generateCodeStep
    if (step.instanceOf(generateCodeStep)) {
      const { code } = step.getOutputs();
      return fixCodeOrAdjustToFeedback(code);
    }

    // fixCodeUntilItRunsStep
    if (step.instanceOf(fixCodeUntilItRunsStep)) {
      const { code } = step.getOutputs();
      return fixCodeOrAdjustToFeedback(code);
    }

    // adjustToFeedbackStep
    if (step.instanceOf(adjustToFeedbackStep)) {
      const { code } = step.getOutputs();

      // no code means no need for adjustment, apply style guide
      if (!code) {
        return getNextIntendedState(
          h,
          "MatchStyleGuide",
          prompt,
          step.inputs.code
        );
      }

      if (code.value.type === "success") {
        return getNextIntendedState(h, "AdjustToFeedback", prompt, code);
      } else {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
    }

    // matchStyleGuideStep
    if (step.instanceOf(matchStyleGuideStep)) {
      const { code } = step.getOutputs();
      if (!code) {
        return h.finish();
      }

      if (code.value.type === "success") {
        return getNextIntendedState(h, "MatchStyleGuide", prompt, code);
      } else {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
    }

    return h.fatal("Unknown step");
  });
}
