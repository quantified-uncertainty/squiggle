import { PromptArtifact } from "../Artifact.js";
import { IOShape } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { matchStyleGuideStep } from "../steps/matchStyleGuideStep.js";
import { Workflow } from "./Workflow.js";

const MAX_RETRIES = 5;
const MAX_ADJUSTS = 3;
const MAX_STYLE_GUIDES = 2;
const MAX_FIXES = 3;

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
        return h.step(matchStyleGuideStep, { prompt, code: step.inputs.code });
      }

      // is the code valid?
      if (code.value.type === "success") {
        if (h.totalRepeats(step.template) < MAX_ADJUSTS) {
          // keep adjusting...
          return h.step(adjustToFeedbackStep, { prompt, code });
        } else {
          // we've adjusted enough, apply style guide
          return h.step(matchStyleGuideStep, { prompt, code });
        }
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

      // repeat style guide while it continues to iterate and we haven't exhausted the style guide budget
      if (code.value.type === "success") {
        if (h.totalRepeats(step.template) < MAX_STYLE_GUIDES) {
          return h.step(matchStyleGuideStep, { prompt, code });
        } else {
          // we've applied the style guide enough and the code is valid, we are done
          return h.finish();
        }
      }

      // failed code means we need to go back to fixing
      if (h.totalRepeats(fixCodeUntilItRunsStep) < MAX_FIXES) {
        return h.step(fixCodeUntilItRunsStep, { code });
      } else {
        // there must be some valid code in the history, let's hope it's good enough, we are done
        return h.finish();
      }
    }

    return h.fatal("Unknown step");
  });
}
