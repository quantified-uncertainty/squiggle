import { generateSummary } from "./generateSummary";
import { LLMName } from "./LLMClient";
import { CodeState, LLMStep, State, StateHandler } from "./LLMStep";
import { TimestampedLogEntry } from "./Logger";
import {
  completionContentToCodeState,
  diffToNewCode,
  squiggleCodeToCodeStateViaRunningAndFormatting,
} from "./processSquiggleCode";
import {
  adjustToFeedbackPrompt,
  editExistingSquiggleCodePrompt,
  generateNewSquiggleCodePrompt,
} from "./prompts";
import { StateManager } from "./StateManager";

function codeStateNextState(codeState: CodeState): State {
  return codeState.type === "success"
    ? State.ADJUST_TO_FEEDBACK
    : State.FIX_CODE_UNTIL_IT_RUNS;
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

function makeCodeGeneratorStep(prompt: string): StateHandler {
  return {
    execute: async (step) => {
      const promptPair = generateNewSquiggleCodePrompt(prompt);
      const completion = await step.queryLLM(promptPair);

      if (completion) {
        const state = await completionContentToCodeState(
          completion,
          step.codeState,
          "generation"
        );
        if (state.okay) {
          step.updateCodeState(state.value);
          step.updateNextState(codeStateNextState(state.value));
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

function makeFixCodeUntilItRunsStep(): StateHandler {
  return {
    execute: async (step) => {
      const { codeState } = step;

      switch (codeState.type) {
        case "success":
          step.log({
            type: "info",
            message: "Code is already successful, moving to Feedback state",
          });
          step.updateNextState(State.ADJUST_TO_FEEDBACK);
          return;
        case "noCode":
          step.log({
            type: "error",
            message:
              "Unexpected code state in FIX_CODE_UNTIL_IT_RUNS. Doesn't have code. This should not be possible.",
          });
          step.updateNextState(State.GENERATE_CODE);
          return;
        case "formattingFailed":
        case "runFailed":
          const promptPair = editExistingSquiggleCodePrompt(
            codeState.code,
            codeState
          );
          const completion = await step.queryLLM(promptPair);
          if (completion) {
            const state = await completionContentToCodeState(
              completion,
              step.codeState,
              "diff"
            );
            if (state.okay) {
              step.updateCodeState(state.value);
              step.updateNextState(codeStateNextState(state.value));
            } else {
              step.log({
                type: "codeRunError",
                error: state.value,
              });
            }
          }
          break;
      }
    },
  };
}

function makeExecuteAdjustToFeedbackStep(prompt: string): StateHandler {
  const handleAdjustToFeedbackResponse = async (
    completionContent: string,
    step: LLMStep
  ): Promise<void> => {
    const trimmedResponse = completionContent.trim();
    const noAdjustmentRegex =
      /no\s+adjust(?:ment)?\s+needed|NO_ADJUSTMENT_NEEDED/i;
    const isShortResponse = trimmedResponse.length <= 100;

    if (noAdjustmentRegex.test(trimmedResponse) && isShortResponse) {
      step.log({
        type: "info",
        message: "LLM determined no adjustment is needed",
      });
      step.updateNextState(State.DONE);
      return;
    }

    if (
      trimmedResponse.length > 0 &&
      !noAdjustmentRegex.test(trimmedResponse)
    ) {
      const diffResponse = diffToNewCode(completionContent, step.codeState);
      if (!diffResponse.okay) {
        step.log({
          type: "error",
          message: "FAIL: " + diffResponse.value,
        });
        step.updateNextState(State.FIX_CODE_UNTIL_IT_RUNS);
        return;
      }

      const { codeState: adjustedCodeState } =
        await squiggleCodeToCodeStateViaRunningAndFormatting(
          diffResponse.value
        );
      step.updateCodeState(adjustedCodeState);
      step.updateNextState(codeStateNextState(adjustedCodeState));
    } else {
      step.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      step.updateNextState(State.DONE);
    }
  };

  return {
    execute: async (step) => {
      const { codeState } = step;

      if (codeState.type !== "success") {
        step.criticalError(
          "Entered Adjust To Feedback stage without a good code state"
        );
        return;
      }

      const currentCode = codeState.code;
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

      if (completion) {
        await handleAdjustToFeedbackResponse(completion, step);
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

    this.registerStateHandlers(input);
  }

  async step(): Promise<boolean> {
    const { continueExecution } = await this.stateManager.step();

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

  private registerStateHandlers(input: GeneratorInput) {
    this.stateManager.registerStateHandler(
      State.GENERATE_CODE,
      makeCodeGeneratorStep(this.prompt)
    );

    this.stateManager.registerStateHandler(
      State.FIX_CODE_UNTIL_IT_RUNS,
      makeFixCodeUntilItRunsStep()
    );

    this.stateManager.registerStateHandler(
      State.ADJUST_TO_FEEDBACK,
      makeExecuteAdjustToFeedbackStep(this.prompt)
    );

    if (input.type === "Create") {
      this.stateManager.registerStateHandler(State.START, {
        execute: async (step) => {
          step.updateNextState(State.GENERATE_CODE);
        },
      });
    } else {
      this.stateManager.registerStateHandler(State.START, {
        execute: async (step) => {
          const { codeState } =
            await squiggleCodeToCodeStateViaRunningAndFormatting(input.code);
          step.updateCodeState(codeState);
          step.updateNextState(codeStateNextState(codeState));
        },
      });
    }
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
  while (!(await generator.step())) {}

  return generator.getFinalResult();
}
