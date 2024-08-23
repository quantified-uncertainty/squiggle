#!/usr/bin/env node
import { generateAndSaveSummary } from "./generateSummary";
import { LLMName, Message, runLLM } from "./llmHelper";
import {
  completionContentToCodeState,
  diffToNewCode,
  squiggleCodeToCodeStateViaRunningAndFormatting,
} from "./processSquiggleCode";
import {
  adjustToFeedbackPrompt,
  editExistingSquiggleCodePrompt,
  generateNewSquiggleCodePrompt,
  PromptPair,
} from "./prompts";
import {
  CodeState,
  State,
  StateExecution,
  StateManager,
  TimestampedLogEntry,
} from "./stateManager";

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
  // llmName: "Claude-Haiku",
  llmName: "Claude-Sonnet",
  // llmName: "GPT4-mini",
  priceLimit: 0.4,
  durationLimitMinutes: 2,
  messagesInHistoryToKeep: 3,
};

class SquiggleGenerator {
  public stateManager: StateManager;
  private prompt: string;
  private llmConfig: LlmConfig;

  constructor(prompt: string, llmConfig: LlmConfig) {
    this.prompt = prompt;
    this.llmConfig = llmConfig;
    this.stateManager = new StateManager(
      this.llmConfig.priceLimit,
      this.llmConfig.durationLimitMinutes
    );
    this.registerStateHandlers();
  }

  async run(): Promise<void> {
    while (true) {
      const { continueExecution } = await this.stateManager.step();
      if (!continueExecution) break;
    }
  }

  private registerStateHandlers() {
    this.stateManager.registerStateHandler(State.GENERATE_CODE, {
      execute: async (stateExecution) => {
        await this.executeGenerateCode(stateExecution);
      },
    });

    this.stateManager.registerStateHandler(State.FIX_CODE_UNTIL_IT_RUNS, {
      execute: async (stateExecution) => {
        await this.executeFixCodeUntilItRuns(stateExecution);
      },
    });

    this.stateManager.registerStateHandler(State.ADJUST_TO_FEEDBACK, {
      execute: async (stateExecution) => {
        await this.executeAdjustToFeedback(stateExecution);
      },
    });
  }

  private async executeGenerateCode(
    stateExecution: StateExecution
  ): Promise<void> {
    const promptPair = generateNewSquiggleCodePrompt(this.prompt);
    const completion = await this.processLLMResponse(
      promptPair,
      stateExecution
    );
    const state = await completionContentToCodeState(
      completion,
      stateExecution.codeState,
      "generation"
    );
    if (state.okay) {
      stateExecution.updateCodeState(state.value);
      stateExecution.updateNextState(codeStateNextState(state.value));
    } else {
      stateExecution.log({
        type: "codeRunError",
        error: state.value as string,
      });
    }
  }

  private async executeFixCodeUntilItRuns(
    stateExecution: StateExecution
  ): Promise<void> {
    const { codeState } = stateExecution;

    switch (codeState.type) {
      case "success":
        stateExecution.log({
          type: "info",
          message: "Code is already successful, moving to Feedback state",
        });
        stateExecution.updateNextState(State.ADJUST_TO_FEEDBACK);
        return;
      case "noCode":
        stateExecution.log({
          type: "error",
          message:
            "Unexpected code state in FIX_CODE_UNTIL_IT_RUNS. Doesn't have code. This should not be possible.",
        });
        //TODO: Roll back to previous state with code.
        stateExecution.updateNextState(State.GENERATE_CODE);
        return;
      case "formattingFailed":
      case "runFailed":
        const promptPair = editExistingSquiggleCodePrompt(
          codeState.code,
          codeState
        );
        const completion = await this.processLLMResponse(
          promptPair,
          stateExecution
        );
        if (completion) {
          const state = await completionContentToCodeState(
            completion,
            stateExecution.codeState,
            "diff"
          );
          if (state.okay) {
            stateExecution.updateCodeState(state.value);
            stateExecution.updateNextState(codeStateNextState(state.value));
          } else {
            stateExecution.log({
              type: "codeRunError",
              error: state.value as string,
            });
          }
        }
        break;
    }
  }

  private async executeAdjustToFeedback(
    stateExecution: StateExecution
  ): Promise<void> {
    const { codeState } = stateExecution;

    if (codeState.type !== "success") {
      stateExecution.criticalError(
        "Entered Adjust To Feedback stage without a good code state"
      );
      return;
    }

    const currentCode = codeState.code!;
    const { codeState: newCodeState, runResult } =
      await squiggleCodeToCodeStateViaRunningAndFormatting(currentCode);

    if (newCodeState.type !== "success" || !runResult) {
      stateExecution.criticalError(
        "Failed to process code in Adjust To Feedback stage"
      );
      return;
    }

    const completion = await this.processLLMResponse(
      adjustToFeedbackPrompt(
        this.prompt,
        codeState.code,
        runResult.bindings,
        runResult.result
      ),
      stateExecution
    );

    if (completion) {
      await this.handleAdjustToFeedbackResponse(completion, stateExecution);
    }
  }

  private async processLLMResponse(
    promptPair: PromptPair,
    stateExecution: StateExecution
  ): Promise<string | null> {
    try {
      const messagesToSend: Message[] = [
        ...this.stateManager.getRelevantPreviousConversationMessages(
          this.llmConfig.messagesInHistoryToKeep
        ),
        {
          role: "user",
          content: promptPair.fullPrompt,
        },
      ];
      const completion = await runLLM(messagesToSend, this.llmConfig.llmName);

      stateExecution.log({
        type: "llmResponse",
        response: completion,
        content: completion.content,
        messages: messagesToSend,
        prompt: promptPair.fullPrompt,
      });

      stateExecution.updateLlmMetrics({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
        llmName: this.llmConfig.llmName,
      });

      if (!completion?.content) {
        stateExecution.log({
          type: "error",
          message: "Received an empty response from the API",
        });
        return null;
      } else {
        stateExecution.addConversationMessage({
          role: "user",
          content: promptPair.summarizedPrompt,
        });

        stateExecution.addConversationMessage({
          role: "assistant",
          content: completion?.content ?? "no response",
        });
      }

      return completion.content;
    } catch (error: any) {
      stateExecution.log({
        type: "error",
        message: `Error in processLLMResponse: ${error.message}`,
      });
      return null;
    }
  }

  private async handleAdjustToFeedbackResponse(
    completionContent: string,
    stateExecution: StateExecution
  ): Promise<void> {
    const trimmedResponse = completionContent.trim();
    const noAdjustmentRegex =
      /no\s+adjust(?:ment)?\s+needed|NO_ADJUSTMENT_NEEDED/i;
    const isShortResponse = trimmedResponse.length <= 100;

    if (noAdjustmentRegex.test(trimmedResponse) && isShortResponse) {
      stateExecution.log({
        type: "info",
        message: "LLM determined no adjustment is needed",
      });
      stateExecution.updateNextState(State.DONE);
      return;
    }

    // Only proceed with diff if there's actual content to process
    if (
      trimmedResponse.length > 0 &&
      !noAdjustmentRegex.test(trimmedResponse)
    ) {
      const diffResponse = diffToNewCode(
        completionContent,
        stateExecution.codeState
      );
      if (!diffResponse.okay) {
        stateExecution.log({
          type: "error",
          message: "FAIL: " + diffResponse.value,
        });
        stateExecution.updateNextState(State.FIX_CODE_UNTIL_IT_RUNS);
        return;
      }

      const { codeState: adjustedCodeState } =
        await squiggleCodeToCodeStateViaRunningAndFormatting(
          diffResponse.value
        );
      stateExecution.updateCodeState(adjustedCodeState);
      stateExecution.updateNextState(codeStateNextState(adjustedCodeState));
    } else {
      // If there's no content to process, consider it as no adjustment needed
      stateExecution.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      stateExecution.updateNextState(State.DONE);
    }
  }
}

export interface SquiggleResult {
  isValid: boolean;
  code: string;
  logs: TimestampedLogEntry[];
}

export const runSquiggleGenerator = async (
  prompt: string,
  llmConfig: LlmConfig = llmConfigDefault
): Promise<SquiggleResult> => {
  const generator = new SquiggleGenerator(prompt, llmConfig);
  try {
    await generator.run();

    generateAndSaveSummary(prompt, generator.stateManager);

    return generator.stateManager.getFinalResult();
  } catch (error) {
    const stateExecution = generator.stateManager.getCurrentStateExecution();
    stateExecution.criticalError(
      "runSquiggleGenerator error:" + error.toString()
    );
    generateAndSaveSummary(prompt, generator.stateManager);

    throw error;
  }
};