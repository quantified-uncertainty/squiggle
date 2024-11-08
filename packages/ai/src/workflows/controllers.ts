import { PromptArtifact } from "../Artifact.js";
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

export function fixAdjustRetryLoop<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  // GENERATE
  workflow.addRule({
    after: generateCodeStep,
    guard: ({ code }) => !!code && code.value.type !== "success",
    produce: ({ code }) => [fixCodeUntilItRunsStep, { code: code! }],
  });

  workflow.addRule({
    after: generateCodeStep,
    guard: ({ code }) => !!code && code.value.type === "success",
    produce: ({ code }) => [adjustToFeedbackStep, { prompt, code: code! }],
  });

  // FIX
  workflow.addRule({
    after: fixCodeUntilItRunsStep,
    guard: ({ code }) => !!code && code.value.type !== "success",
    produce: ({ code }) => [fixCodeUntilItRunsStep, { code: code! }],
  });

  workflow.addRule({
    after: fixCodeUntilItRunsStep,
    guard: ({ code }) => !!code && code.value.type === "success",
    produce: ({ code }) => [adjustToFeedbackStep, { prompt, code: code! }],
  });

  // ADJUST
  // adjust has three legs:
  // - no code means no need for adjustment, apply style guide
  // - successful code means we're adjusting and need to adjust again
  // - failed code means we need to fix the code before we can adjust again
  workflow.addRule({
    after: adjustToFeedbackStep,
    guard: ({ code }) => !code,
    produce: () => {
      const code = workflow.getRecentValidCode();
      if (!code) {
        throw new Error("Impossible state");
      }
      return [matchStyleGuideStep, { prompt, code }];
    },
  });

  // repeat adjust while it continues to adjust
  workflow.addRule({
    after: adjustToFeedbackStep,
    guard: ({ code }) => !!code && code.value.type === "success",
    produce: ({ code }) => [adjustToFeedbackStep, { prompt, code: code! }],
  });

  // fix code if adjust fails
  workflow.addRule({
    after: adjustToFeedbackStep,
    guard: ({ code }) => !!code && code.value.type !== "success",
    produce: ({ code }) => [fixCodeUntilItRunsStep, { code: code! }],
  });

  retryMinorFailures(workflow);
}
