import { generateSummary } from "./generateSummary";
import { LLMName } from "./LLMClient";
import { CodeState, LLMStepTemplate } from "./LLMStep";
import { TimestampedLogEntry } from "./Logger";
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
import { Workflow } from "./Workflow";

function addStepByCodeState(
  workflow: Workflow,
  codeState: CodeState,
  prompt: string
) {
  if (codeState.type === "success") {
    workflow.addStep(executeAdjustToFeedbackStep, {
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

export interface SquiggleResult {
  isValid: boolean;
  code: string;
  logs: TimestampedLogEntry[];
  totalPrice: number;
  runTimeMs: number;
  llmRunCount: number;
  logSummary: string; // markdown
}

export type GeneratorInput =
  | { type: "Create"; prompt: string }
  | { type: "Edit"; code: string };

const codeGeneratorStep = new LLMStepTemplate(
  "GenerateCode",
  {
    inputs: { prompt: "prompt" },
    outputs: { code: "code" },
  },
  async (context) => {
    const prompt = context.getInput("prompt").value;
    const promptPair = generateNewSquiggleCodePrompt(prompt);
    const completion = await context.queryLLM(promptPair);

    if (completion) {
      const state = await generationCompletionContentToCodeState(completion);
      if (state.okay) {
        addStepByCodeState(context.workflow, state.value, prompt);
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
  async (context) => {
    const prompt = context.getInput("prompt").value;
    const codeState = context.getInput("codeState").value;

    const promptPair = editExistingSquiggleCodePrompt(
      codeState.code,
      codeState
    );

    const completion = await context.queryLLM(promptPair);
    if (completion) {
      const nextState = await diffCompletionContentToCodeState(
        completion,
        codeState
      );
      if (nextState.okay) {
        addStepByCodeState(context.workflow, nextState.value, prompt);
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

const executeAdjustToFeedbackStep = new LLMStepTemplate(
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
  async (context) => {
    const prompt = context.getInput("prompt").value;
    const codeState = context.getInput("codeState").value;

    const currentCode = codeState.code;

    // re-run and get result
    const { codeState: newCodeState, runResult } =
      await squiggleCodeToCodeStateViaRunningAndFormatting(currentCode);

    if (newCodeState.type !== "success" || !runResult) {
      throw new Error("Failed to process code in Adjust To Feedback stage");
      return;
    }

    const completion = await context.queryLLM(
      adjustToFeedbackPrompt(
        prompt,
        codeState.code,
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
      context.setOutput("code", { kind: "code", value: codeState.code });
      return;
    }

    if (
      trimmedResponse.length > 0 &&
      !noAdjustmentRegex.test(trimmedResponse)
    ) {
      const diffResponse = diffToNewCode(completion, codeState);
      if (!diffResponse.okay) {
        context.log({
          type: "error",
          message: "FAIL: " + diffResponse.value,
        });
        // try again
        context.workflow.addStep(executeAdjustToFeedbackStep, {
          prompt: { kind: "prompt", value: prompt },
          codeState: { kind: "codeState", value: codeState },
        });
        context.setOutput("code", { kind: "code", value: codeState.code });
        return;
      }

      const { codeState: adjustedCodeState } =
        await squiggleCodeToCodeStateViaRunningAndFormatting(
          diffResponse.value
        );
      addStepByCodeState(context.workflow, adjustedCodeState, prompt);
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
      context.setOutput("code", { kind: "code", value: codeState.code });
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
  async (context) => {
    const code = context.getInput("code").value;
    const prompt = context.getInput("prompt").value;

    const { codeState } =
      await squiggleCodeToCodeStateViaRunningAndFormatting(code);
    addStepByCodeState(context.workflow, codeState, prompt);
  }
);

export class SquiggleGenerator {
  public workflow: Workflow;
  private prompt: string;
  private startTime: number;
  private abortSignal?: AbortSignal; // TODO - unused

  constructor({
    input,
    llmConfig,
    abortSignal,
    openaiApiKey,
    anthropicApiKey,
  }: {
    input: GeneratorInput;
    llmConfig?: LlmConfig;
    abortSignal?: AbortSignal;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) {
    this.prompt = input.type === "Create" ? input.prompt : "";
    this.abortSignal = abortSignal;
    this.workflow = new Workflow(
      llmConfig ?? llmConfigDefault,
      openaiApiKey,
      anthropicApiKey
    );

    this.startTime = Date.now();

    this.addFirstStep(input);
  }

  private addFirstStep(input: GeneratorInput) {
    if (input.type === "Create") {
      this.workflow.addStep(codeGeneratorStep, {
        prompt: { kind: "prompt", value: this.prompt },
      });
    } else {
      this.workflow.addStep(runAndFormatCodeStep, {
        prompt: { kind: "prompt", value: this.prompt },
        code: { kind: "code", value: input.code },
      });
    }
  }

  async runNextStep(): Promise<boolean> {
    const { continueExecution } = await this.workflow.runNextStep();

    if (!continueExecution) {
      // saveSummaryToFile(generateSummary(this.prompt, this.workflow));
      return true;
    }

    return false;
  }

  getFinalResult(): SquiggleResult {
    const logSummary = generateSummary(this.prompt, this.workflow);
    const endTime = Date.now();
    const runTimeMs = endTime - this.startTime;
    const { totalPrice, llmRunCount } = this.workflow.getLlmMetrics();

    const finalResult: SquiggleResult = {
      ...this.workflow.getFinalResult(),
      totalPrice,
      runTimeMs,
      llmRunCount,
      logSummary,
    };
    return finalResult;
  }
}

export async function runSquiggleGenerator(params: {
  input: GeneratorInput;
  abortSignal?: AbortSignal;
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}): Promise<SquiggleResult> {
  if (!params.anthropicApiKey) {
    throw new Error("Anthropic API key is required");
  }

  const generator = new SquiggleGenerator(params);

  // Run the generator steps until completion
  while (!(await generator.runNextStep())) {}

  return generator.getFinalResult();
}
