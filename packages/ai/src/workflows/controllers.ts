import { CodeArtifact, PromptArtifact } from "../Artifact.js";
import { IOShape } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { matchStyleGuideStep } from "../steps/matchStyleGuideStep.js";
import { Workflow } from "./Workflow.js";

function retryMinorFailures(workflow: Workflow<any>) {
  workflow.addEventListener("stepFinished", ({ data: { step } }) => {
    const state = step.getState();
    if (state.kind !== "FAILED" || state.errorType !== "MINOR") {
      return;
    }
    workflow.addRetryOfPreviousStep();
  });
}

function codeRuns(code: CodeArtifact | undefined) {
  return !!code && code.value.type === "success";
}

function codeDoesntRun(code: CodeArtifact | undefined) {
  return !!code && code.value.type !== "success";
}

function generateCodeStepSteps<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  const thisStep = generateCodeStep;
  const nextStep = adjustToFeedbackStep;

  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => codeRuns(code),
    produce: ({ code }) => [nextStep, { prompt, code: code! }],
  });

  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => codeDoesntRun(code),
    produce: ({ code }) => [fixCodeUntilItRunsStep, { code: code! }],
  });
}

function fixCodeUntilItRunsStepSteps<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  const thisStep = fixCodeUntilItRunsStep;
  const nextStep = adjustToFeedbackStep;

  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => codeRuns(code),
    produce: ({ code }) => [nextStep, { prompt, code: code! }],
  });

  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => codeDoesntRun(code),
    produce: ({ code }) => [thisStep, { code: code! }],
  });
}

function adjustToFeedbackStepSteps<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  const thisStep = adjustToFeedbackStep;
  const nextStep = matchStyleGuideStep;

  // adjust has three legs:
  // - no code means no need for adjustment, apply style guide
  // - successful code means we're adjusting and need to adjust again
  // - failed code means we need to fix the code before we can adjust again
  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => !code,
    produce: () => {
      const code = workflow.getRecentValidCode();
      if (!code) {
        throw new Error("Impossible state");
      }
      return [nextStep, { prompt, code }];
    },
  });

  // repeat adjust while it continues to adjust
  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => codeRuns(code),
    produce: ({ code }) => [thisStep, { prompt, code: code! }],
  });

  // fix code if adjust fails
  workflow.addRule({
    after: thisStep,
    guard: ({ code }) => codeDoesntRun(code),
    produce: ({ code }) => [fixCodeUntilItRunsStep, { code: code! }],
  });
}

export function fixAdjustRetryLoop<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  generateCodeStepSteps(workflow, prompt);
  fixCodeUntilItRunsStepSteps(workflow, prompt);
  adjustToFeedbackStepSteps(workflow, prompt);
  retryMinorFailures(workflow);
}
