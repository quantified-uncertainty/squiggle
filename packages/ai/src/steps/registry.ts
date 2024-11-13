import { Inputs, IOShape, LLMStepTemplate } from "../LLMStepTemplate.js";
import { adjustToFeedbackStep } from "./adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "./fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "./generateCodeStep.js";
import { matchStyleGuideStep } from "./matchStyleGuideStep.js";
import { runAndFormatCodeStep } from "./runAndFormatCodeStep.js";

export function getStepTemplateByName(name: string) {
  const templates = Object.fromEntries(
    [
      adjustToFeedbackStep,
      generateCodeStep,
      fixCodeUntilItRunsStep,
      runAndFormatCodeStep,
      matchStyleGuideStep,
    ].map((step) => [step.name, step])
  );

  if (!(name in templates)) {
    throw new Error(`Step ${name} not found`);
  }
  return templates[name];
}

type Distribute<U> =
  U extends LLMStepTemplate<infer Shape> ? [U, Inputs<Shape>] : never;

// This type is somewhat type-safe; if you return `[specificStep, inputs]`, then
// inputs must include all inputs for that step, but TypeScript won't check
// that there are no extra inputs.
export type ValidStepTuple =
  | Distribute<ReturnType<typeof getStepTemplateByName>>
  | [LLMStepTemplate<IOShape>, Inputs<IOShape>];
