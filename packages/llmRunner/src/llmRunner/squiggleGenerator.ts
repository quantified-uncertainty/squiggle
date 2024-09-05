import { generateSummary } from "./generateSummary";
import { LLMName } from "./LLMClient";
import { CodeState, Kind, LLMStepDescription } from "./LLMStep";
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
import { StateManager } from "./StateManager";

function addStepByCodeState(
  manager: StateManager,
  codeState: CodeState,
  prompt: string
) {
  if (codeState.type === "success") {
    manager.addStep(makeExecuteAdjustToFeedbackStep(prompt, codeState));
  } else {
    manager.addStep(makeFixCodeUntilItRunsStep(prompt, codeState));
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

function makeCodeGeneratorStep(prompt: string): LLMStepDescription {
  return {
    state: Kind.GENERATE_CODE,
    execute: async (step) => {
      const promptPair = generateNewSquiggleCodePrompt(prompt);
      const completion = await step.queryLLM(promptPair);

      if (completion) {
        const state = await generationCompletionContentToCodeState(completion);
        if (state.okay) {
          addStepByCodeState(step.stateManager, state.value, prompt);
          return { code: state.value.code };
        } else {
          step.log({
            type: "codeRunError",
            error: state.value,
          });
        }
      }
    },
  };
}

function makeFixCodeUntilItRunsStep(
  prompt: string,
  codeState: Exclude<CodeState, { type: "success" }>
): LLMStepDescription {
  return {
    state: Kind.FIX_CODE_UNTIL_IT_RUNS,
    execute: async (step) => {
      step.logCodeState(codeState);
      const promptPair = editExistingSquiggleCodePrompt(
        codeState.code,
        codeState
      );

      const completion = await step.queryLLM(promptPair);
      if (completion) {
        const nextState = await diffCompletionContentToCodeState(
          completion,
          codeState
        );
        if (nextState.okay) {
          addStepByCodeState(step.stateManager, nextState.value, prompt);
          return { code: nextState.value.code };
        } else {
          step.log({
            type: "codeRunError",
            error: nextState.value,
          });
        }
      }
    },
  };
}

function makeExecuteAdjustToFeedbackStep(
  prompt: string,
  codeState: Extract<CodeState, { type: "success" }>
): LLMStepDescription {
  return {
    state: Kind.ADJUST_TO_FEEDBACK,
    execute: async (step) => {
      step.logCodeState(codeState);

      const currentCode = codeState.code;

      // re-run and get result
      const { codeState: newCodeState, runResult } =
        await squiggleCodeToCodeStateViaRunningAndFormatting(currentCode);

      if (newCodeState.type !== "success" || !runResult) {
        step.criticalError(
          "Failed to process code in Adjust To Feedback stage"
        );
        return;
      }

      const completion = await step.queryLLM(
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
        step.log({
          type: "info",
          message: "LLM determined no adjustment is needed",
        });
        return { code: codeState.code };
      }

      if (
        trimmedResponse.length > 0 &&
        !noAdjustmentRegex.test(trimmedResponse)
      ) {
        const diffResponse = diffToNewCode(completion, codeState);
        if (!diffResponse.okay) {
          step.log({
            type: "error",
            message: "FAIL: " + diffResponse.value,
          });
          // try again
          step.stateManager.addStep(
            makeExecuteAdjustToFeedbackStep(prompt, codeState)
          );
          return { code: codeState.code };
        }

        const { codeState: adjustedCodeState } =
          await squiggleCodeToCodeStateViaRunningAndFormatting(
            diffResponse.value
          );
        addStepByCodeState(step.stateManager, adjustedCodeState, prompt);
        return { code: adjustedCodeState.code };
      } else {
        step.log({
          type: "info",
          message: "No adjustments provided, considering process complete",
        });
        return { code: codeState.code };
      }
    },
  };
}

export class SquiggleGenerator {
  public stateManager: StateManager;
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
    this.stateManager = new StateManager(
      llmConfig ?? llmConfigDefault,
      openaiApiKey,
      anthropicApiKey
    );

    this.startTime = Date.now();

    this.addFirstStep(input);
  }

  private addFirstStep(input: GeneratorInput) {
    if (input.type === "Create") {
      this.stateManager.addStep(makeCodeGeneratorStep(this.prompt));
    } else {
      this.stateManager.addStep({
        state: Kind.START,
        execute: async () => {
          const { codeState } =
            await squiggleCodeToCodeStateViaRunningAndFormatting(input.code);
          addStepByCodeState(this.stateManager, codeState, this.prompt);
          return { code: codeState.code };
        },
      });
    }
  }

  async runNextStep(): Promise<boolean> {
    const { continueExecution } = await this.stateManager.runNextStep();

    if (!continueExecution) {
      // saveSummaryToFile(generateSummary(this.prompt, this.stateManager));
      return true;
    }

    return false;
  }

  getFinalResult(): SquiggleResult {
    const logSummary = generateSummary(this.prompt, this.stateManager);
    const endTime = Date.now();
    const runTimeMs = endTime - this.startTime;
    const { totalPrice, llmRunCount } = this.stateManager.getLlmMetrics();

    const finalResult: SquiggleResult = {
      ...this.stateManager.getFinalResult(),
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
