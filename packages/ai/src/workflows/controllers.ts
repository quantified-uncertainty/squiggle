import { CodeArtifact, PromptArtifact } from "../Artifact.js";
import { LLMStepInstance } from "../LLMStepInstance.js";
import { IOShape, StepState } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { matchStyleGuideStep } from "../steps/matchStyleGuideStep.js";
import { runAndFormatCodeStep } from "../steps/runAndFormatCodeStep.js";
import { StepTransitionRule, Workflow } from "./Workflow.js";
import {
  NextStepAction,
  WorkflowGuardHelpers,
} from "./WorkflowGuardHelpers.js";

const MAX_MINOR_ERRORS = 5;

// Error Messages
const ERROR_MESSAGES = {
  FAILED_STEP: (stepName: string, errorType: string) =>
    `Step ${stepName} failed with error type ${errorType}`,
  NOT_DONE: (stepName: string, state: string) =>
    `Impossible, step ${stepName} is not done: ${state}`,
  NO_CODE: "Impossible state, generate didn't return code",
  UNKNOWN_STEP: "Unknown step",
};

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

  return undefined;
}

// assumes that the step is done
function getOutputs<Shape extends IOShape, WorkflowShape extends IOShape>(
  step: LLMStepInstance<Shape, WorkflowShape>
): Extract<StepState<Shape>, { kind: "DONE" }>["outputs"] {
  const state = step.getState();
  if (state.kind !== "DONE") {
    throw new Error(ERROR_MESSAGES.NOT_DONE(step.template.name, state.kind));
  }
  return state.outputs;
}

export function getDefaultTransitionRule<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
): StepTransitionRule<Shape> {
  const config = {
    maxNumericSteps: workflow.llmConfig.numericSteps,
    maxStyleGuideSteps: workflow.llmConfig.styleGuideSteps,
  };

  return (step, h) => {
    const getNextIntendedState = (
      intendedStep: "AdjustToFeedback" | "MatchStyleGuide",
      code: CodeArtifact
    ): NextStepAction => {
      const nextSteps = [
        // Only check AdjustToFeedback if it's intended and has runs remaining
        intendedStep === "AdjustToFeedback" &&
        h.totalRepeats(adjustToFeedbackStep) < config.maxNumericSteps
          ? h.step(adjustToFeedbackStep, { prompt, code })
          : null,
        // Always check MatchStyleGuide
        h.totalRepeats(matchStyleGuideStep) < config.maxStyleGuideSteps
          ? h.step(matchStyleGuideStep, { prompt, code })
          : null,
      ].filter((r) => !!r);
      return nextSteps.length ? nextSteps[0] : h.finish();
    };

    // process bad states
    const failedState = handleFailedState(step, h);
    if (failedState) return failedState;

    const fixCodeOrAdjustToFeedback = (code: CodeArtifact): NextStepAction => {
      if (code.value.type !== "success") {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
      return getNextIntendedState("AdjustToFeedback", code);
    };

    // generateCodeStep
    if (step.instanceOf(generateCodeStep)) {
      const { code } = getOutputs(step);
      return fixCodeOrAdjustToFeedback(code);
    }

    // runAndFormatCodeStep
    if (step.instanceOf(runAndFormatCodeStep)) {
      const { code } = getOutputs(step);
      return fixCodeOrAdjustToFeedback(code);
    }

    // fixCodeUntilItRunsStep
    if (step.instanceOf(fixCodeUntilItRunsStep)) {
      const { code } = getOutputs(step);
      return fixCodeOrAdjustToFeedback(code);
    }

    // adjustToFeedbackStep
    if (step.instanceOf(adjustToFeedbackStep)) {
      const { code } = getOutputs(step);

      // no code means no need for adjustment, apply style guide
      if (!code) {
        return getNextIntendedState("MatchStyleGuide", step.inputs.code);
      }

      if (code.value.type === "success") {
        return getNextIntendedState("AdjustToFeedback", code);
      } else {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
    }

    // matchStyleGuideStep
    if (step.instanceOf(matchStyleGuideStep)) {
      const { code } = getOutputs(step);
      if (!code) {
        return h.finish();
      }

      if (code.value.type === "success") {
        return getNextIntendedState("MatchStyleGuide", code);
      } else {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
    }

    return h.fatal("Unknown step");
  };
}
