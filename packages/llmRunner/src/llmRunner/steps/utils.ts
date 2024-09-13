import { CodeState } from "../CodeState";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep";
import { Workflow } from "../Workflow";

export function addStepByCodeState(
  workflow: Workflow,
  codeState: CodeState,
  prompt: string
) {
  if (codeState.type === "success") {
    workflow.addStep(adjustToFeedbackStep, {
      prompt: { kind: "prompt", value: prompt },
      codeState: { kind: "codeState", value: codeState },
    });
  } else {
    workflow.addStep(fixCodeUntilItRunsStep, {
      prompt: { kind: "prompt", value: prompt },
      codeState: { kind: "codeState", value: codeState },
    });
  }
}
