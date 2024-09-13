import { SquiggleWorkflowResult } from "../app/utils/squiggleTypes";
import { generateSummary } from "./generateSummary";
import { LLMName } from "./LLMClient";
import { CodeState, LLMStepTemplate } from "./LLMStep";
import {
  diffCompletionContentToCodeState,
  diffToNewCode,
  generationCompletionContentToCodeState,
  squiggleCodeToCodeStateViaRunningAndFormatting,
} from "./processSquiggleCode";
import {
  adjustToFeedbackPrompt,
  editExistingSquiggleCodePrompt,
  generateNewSquiggleCodePrompt,
} from "./prompts";
import { Workflow, WorkflowEventListener, WorkflowEventType } from "./Workflow";

function addStepByCodeState(
  workflow: Workflow,
  codeState: CodeState,
  prompt: string
) {
  const step =
    codeState.type === "success"
      ? // both of these steps take prompt+codeState
        adjustToFeedbackStep
      : fixCodeUntilItRunsStep;

  workflow.addStep(step, {
    prompt: { kind: "prompt", value: prompt },
    codeState: { kind: "codeState", value: codeState },
  });
}

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

const generateCodeStep = new LLMStepTemplate(
  "GenerateCode",
  {
    inputs: { prompt: "prompt" },
    outputs: { code: "code" },
  },
  async (context, { prompt }) => {
    const promptPair = generateNewSquiggleCodePrompt(prompt.value);
    const completion = await context.queryLLM(promptPair);

    if (completion) {
      const state = await generationCompletionContentToCodeState(completion);
      if (state.ok) {
        addStepByCodeState(context.workflow, state.value, prompt.value);
        context.setOutput("code", { kind: "code", value: state.value.code });
      } else {
        context.log({
          type: "codeRunError",
          error: state.value,
        });
      }
    }
  }
);

const fixCodeUntilItRunsStep = new LLMStepTemplate(
  "FixCodeUntilItRuns",
  {
    inputs: {
      prompt: "prompt",
      codeState: "codeState",
    },
    outputs: { code: "code" },
  },
  async (context, { prompt, codeState }) => {
    const promptPair = editExistingSquiggleCodePrompt(codeState.value);

    const completion = await context.queryLLM(promptPair);
    if (completion) {
      const nextState = await diffCompletionContentToCodeState(
        completion,
        codeState.value
      );
      if (nextState.ok) {
        addStepByCodeState(context.workflow, nextState.value, prompt.value);
        context.setOutput("code", {
          kind: "code",
          value: nextState.value.code,
        });
      } else {
        context.log({
          type: "codeRunError",
          error: nextState.value,
        });
      }
    }
  }
);

const adjustToFeedbackStep = new LLMStepTemplate(
  "AdjustToFeedback",
  {
    inputs: {
      prompt: "prompt",
      codeState: "codeState",
    },
    outputs: {
      code: "code",
    },
  },
  async (context, { prompt, codeState }) => {
    const currentCode = codeState.value.code;

    // re-run and get result
    const { codeState: newCodeState, runResult } =
      await squiggleCodeToCodeStateViaRunningAndFormatting(currentCode);

    if (newCodeState.type !== "success" || !runResult) {
      throw new Error("Failed to process code in AdjustToFeedback stage");
    }

    const completion = await context.queryLLM(
      adjustToFeedbackPrompt(
        prompt.value,
        codeState.value.code,
        runResult.bindings,
        runResult.result
      )
    );

    if (!completion) {
      return;
    }

    // handle adjustment response

    const trimmedResponse = completion.trim();
    const noAdjustmentRegex =
      /no\s+adjust(?:ment)?\s+needed|NO_ADJUSTMENT_NEEDED/i;
    const isShortResponse = trimmedResponse.length <= 100;

    if (noAdjustmentRegex.test(trimmedResponse) && isShortResponse) {
      context.log({
        type: "info",
        message: "LLM determined no adjustment is needed",
      });
      context.setOutput("code", { kind: "code", value: codeState.value.code });
      return;
    }

    if (
      trimmedResponse.length > 0 &&
      !noAdjustmentRegex.test(trimmedResponse)
    ) {
      const diffResponse = diffToNewCode(completion, codeState.value);
      if (!diffResponse.ok) {
        context.log({
          type: "error",
          message: "FAIL: " + diffResponse.value,
        });
        // try again
        context.workflow.addStep(adjustToFeedbackStep, {
          prompt: { kind: "prompt", value: prompt.value },
          codeState: { kind: "codeState", value: codeState.value },
        });
        context.setOutput("code", {
          kind: "code",
          value: codeState.value.code,
        });
        return;
      }

      const { codeState: adjustedCodeState } =
        await squiggleCodeToCodeStateViaRunningAndFormatting(
          diffResponse.value
        );
      addStepByCodeState(context.workflow, adjustedCodeState, prompt.value);
      context.setOutput("code", {
        kind: "code",
        value: adjustedCodeState.code,
      });
      return;
    } else {
      context.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      context.setOutput("code", { kind: "code", value: codeState.value.code });
      return;
    }
  }
);

const runAndFormatCodeStep = new LLMStepTemplate(
  "RunAndFormatCode",
  {
    inputs: { code: "code", prompt: "prompt" },
    outputs: { codeState: "codeState" },
  },
  async (context, { code, prompt }) => {
    const { codeState } = await squiggleCodeToCodeStateViaRunningAndFormatting(
      code.value
    );
    addStepByCodeState(context.workflow, codeState, prompt.value);
  }
);

type SquiggleEventHandlers = Partial<{
  [K in WorkflowEventType]?: WorkflowEventListener<K>;
}> & {
  // fake squiggle-specific event
  finishSquiggleWorkflow: (event: {
    data: { result: SquiggleWorkflowResult };
  }) => void;
};

// Run Squiggle workflow and stream the results through the handlers
export async function runSquiggleGenerator(params: {
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
export async function runSquiggleGeneratorToResult(params: {
  input: GeneratorInput;
  abortSignal?: AbortSignal;
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}): Promise<SquiggleWorkflowResult> {
  let finalResult: SquiggleWorkflowResult | undefined;
  await runSquiggleGenerator({
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
