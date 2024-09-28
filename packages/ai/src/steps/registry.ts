import { adjustToFeedbackStep } from "./adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "./fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "./generateCodeStep.js";
import { runAndFormatCodeStep } from "./runAndFormatCodeStep.js";

const templates = Object.fromEntries(
  [
    adjustToFeedbackStep,
    generateCodeStep,
    fixCodeUntilItRunsStep,
    runAndFormatCodeStep,
  ].map((step) => [step.name, step])
);

export function getStepTemplateByName(name: string) {
  if (!(name in templates)) {
    throw new Error(`Step ${name} not found`);
  }
  return templates[name];
}
