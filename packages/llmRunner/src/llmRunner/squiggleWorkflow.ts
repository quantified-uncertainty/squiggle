import { SquiggleWorkflowResult } from "../app/utils/squiggleTypes";
import { generateSummary } from "./generateSummary";
import { LLMName } from "./LLMClient";
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

  const prompt = input.type === "Create" ? input.prompt : "";
  const workflow = new Workflow(
    params.llmConfig ?? llmConfigDefault,
    params.openaiApiKey,
    params.anthropicApiKey
  );

  const startTime = Date.now();

  // Prepare event handlers
  workflow.addEventListener("stepUpdated", ({ data: { step } }) => {});

  for (const [eventType, listener] of Object.entries(params.handlers)) {
    workflow.addEventListener(
      eventType as WorkflowEventType,
      listener as WorkflowEventListener<WorkflowEventType>
    );
  }

  // Add the initial step
  if (input.type === "Create") {
    workflow.addStep(generateCodeStep, {
      prompt: { kind: "prompt", value: prompt },
    });
  } else {
    workflow.addStep(runAndFormatCodeStep, {
      prompt: { kind: "prompt", value: prompt },
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
    const logSummary = generateSummary(prompt, workflow);
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
