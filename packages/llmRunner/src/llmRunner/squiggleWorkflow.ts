import { SquiggleWorkflowResult } from "../app/utils/squiggleTypes";
import { Artifact } from "./Artifact";
import { generateSummary } from "./generateSummary";
import { LLMName } from "./LLMClient";
import { adjustToFeedbackStep } from "./steps/adjustToFeedbackStep";
import { fixCodeUntilItRunsStep } from "./steps/fixCodeUntilItRunsStep";
import { generateCodeStep } from "./steps/generateCodeStep";
import { runAndFormatCodeStep } from "./steps/runAndFormatCodeStep";
import { Workflow, WorkflowEventListener, WorkflowEventType } from "./Workflow";

export interface LlmConfig {
  llmName: LLMName;
  priceLimit: number;
  durationLimitMinutes: number;
  messagesInHistoryToKeep: number;
}

export const llmConfigDefault: LlmConfig = {
  llmName: "Claude-Sonnet",
  priceLimit: 0.3,
  durationLimitMinutes: 1,
  messagesInHistoryToKeep: 4,
};

export type GeneratorInput =
  | { type: "Create"; prompt: string }
  | { type: "Edit"; code: string };

type SquiggleEventHandlers = Partial<{
  [K in WorkflowEventType]?: WorkflowEventListener<K>;
}> & {
  // fake squiggle-specific event
  finishSquiggleWorkflow: (event: {
    data: { result: SquiggleWorkflowResult };
  }) => void;
};

// Run Squiggle workflow and stream the results through the handlers
export async function runSquiggleWorkflow(params: {
  input: GeneratorInput;
  abortSignal?: AbortSignal;
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  handlers: SquiggleEventHandlers;
}): Promise<void> {
  if (!params.anthropicApiKey) {
    throw new Error("Anthropic API key is required");
  }

  const input = params.input;

  const prompt: Artifact = {
    kind: "prompt",
    value: input.type === "Create" ? input.prompt : "",
  };

  const workflow = new Workflow(
    params.llmConfig ?? llmConfigDefault,
    params.openaiApiKey,
    params.anthropicApiKey
  );

  const startTime = Date.now();

  // Prepare event handlers
  for (const [eventType, listener] of Object.entries(params.handlers)) {
    workflow.addEventListener(
      eventType as WorkflowEventType,
      listener as WorkflowEventListener<WorkflowEventType>
    );
  }

  // Controller - add steps based on the current step's outputs
  workflow.addEventListener("stepUpdated", ({ data: { step } }) => {
    if (step.getState().kind !== "DONE") {
      return;
    }

    const codeState = step.getOutputs()["codeState"];
    if (codeState?.kind !== "codeState") {
      return;
    }

    if (codeState.value.type === "success") {
      workflow.addStep(adjustToFeedbackStep, { prompt, codeState });
    } else {
      workflow.addStep(fixCodeUntilItRunsStep, { prompt, codeState });
    }
  });

  // Add the initial step
  if (input.type === "Create") {
    workflow.addStep(generateCodeStep, { prompt });
  } else {
    workflow.addStep(runAndFormatCodeStep, {
      code: { kind: "code", value: input.code },
    });
  }

  // Run the generator steps until completion
  while (true) {
    const { continueExecution } = await workflow.runNextStep();

    if (!continueExecution) {
      // saveSummaryToFile(generateSummary(this.prompt, this.workflow));
      break;
    }
  }

  // Prepare and dispatch final result
  {
    const logSummary = generateSummary(prompt.value, workflow);
    const endTime = Date.now();
    const runTimeMs = endTime - startTime;
    const { totalPrice, llmRunCount } = workflow.getLlmMetrics();

    const result: SquiggleWorkflowResult = {
      ...workflow.getFinalResult(),
      totalPrice,
      runTimeMs,
      llmRunCount,
      logSummary,
    };
    params.handlers.finishSquiggleWorkflow?.({
      data: { result },
    });
  }
}

// Run Squiggle workflow without streaming, only capture the final result
export async function runSquiggleWorkflowToResult(params: {
  input: GeneratorInput;
  abortSignal?: AbortSignal;
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}): Promise<SquiggleWorkflowResult> {
  let finalResult: SquiggleWorkflowResult | undefined;
  await runSquiggleWorkflow({
    ...params,
    handlers: {
      finishSquiggleWorkflow: (event) => {
        finalResult = event.data.result;
      },
    },
  });

  if (!finalResult) {
    throw new Error("No final result");
  }
  return finalResult;
}
