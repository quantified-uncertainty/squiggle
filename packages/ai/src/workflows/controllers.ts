import { PromptArtifact } from "../Artifact.js";
import { IOShape } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { matchStyleGuideStep } from "../steps/matchStyleGuideStep.js";
import { Workflow } from "./Workflow.js";

const MAX_RETRIES = 5;

export function fixAdjustRetryLoop<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  prompt: PromptArtifact
) {
  workflow.addLinearRule((step, h) => {
    // process bad states
    {
      const state = step.getState();
      if (state.kind === "FAILED") {
        if (state.errorType === "MINOR") {
          if (h.recentFailedRepeats(fixCodeUntilItRunsStep) > MAX_RETRIES) {
            return h.finish(); // give up
          }
          return h.repeat();
        }

        return h.fatal(
          `Step ${step.template.name} failed with error type ${state.errorType}`
        );
      }

      if (state.kind !== "DONE") {
        return h.fatal(
          `Impossible, step ${step.template.name} is not done: ${state.kind}`
        );
      }
    }

    // GENERATE
    if (step.instanceOf(generateCodeStep)) {
      const { code } = step.getOutputs();
      if (!code) {
        return h.fatal("Impossible state, generate didn't return code");
      }
      if (code.value.type !== "success") {
        return h.step(fixCodeUntilItRunsStep, { code });
      }
      return h.step(adjustToFeedbackStep, { prompt, code });
    }

    // FIX
    if (step.instanceOf(fixCodeUntilItRunsStep)) {
      const { code } = step.getOutputs();
      if (!code) {
        return h.fatal("Impossible state, generate didn't return code");
      }
      if (code.value.type !== "success") {
        return h.step(fixCodeUntilItRunsStep, { code });
      }

      return h.step(adjustToFeedbackStep, { prompt, code });
    }

    // ADJUST
    if (step.instanceOf(adjustToFeedbackStep)) {
      const { code } = step.getOutputs();

      // no code means no need for adjustment, apply style guide
      if (!code) {
        const code = workflow.getRecentValidCode();
        if (!code) {
          return h.fatal("Impossible state");
        }
        return h.step(matchStyleGuideStep, { prompt, code });
      }

      // repeat adjust while it continues to adjust
      if (code.value.type === "success") {
        return h.step(adjustToFeedbackStep, { prompt, code });
      }

      // failed code means we need to fix the code before we can adjust again
      return h.step(fixCodeUntilItRunsStep, { code });
    }

    // MATCH STYLE GUIDE
    if (step.instanceOf(matchStyleGuideStep)) {
      const { code } = step.getOutputs();
      if (!code) {
        // style guide has decided that no changes are needed, we are done
        return h.finish();
      }

      // repeat style guide while it continues to iterate
      if (code.value.type === "success") {
        return h.step(matchStyleGuideStep, { prompt, code });
      }

      // failed code means we need to go back to fixing
      return h.step(fixCodeUntilItRunsStep, { code });
    }

    return h.fatal("Unknown step");
  });
}
