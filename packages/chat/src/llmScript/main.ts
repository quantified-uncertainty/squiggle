#!/usr/bin/env node
//main.ts
import { generateAndSaveSummary } from "./generateSummary";
import { runLLM } from "./llmConfig";
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
  LogEntry,
  LogLevel,
  State,
  StateExecution,
  StateManager,
} from "./stateManager";

function codeStateNextState(codeState: CodeState): State {
  return codeState.type === "success"
    ? State.ADJUST_TO_FEEDBACK
    : State.FIX_CODE_UNTIL_IT_RUNS;
}

class SquiggleGenerator {
  public stateManager: StateManager;
  private prompt: string;

  constructor(prompt: string) {
    this.prompt = prompt;
    this.stateManager = new StateManager();
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
      stateExecution.log(state.value as string, LogLevel.CODE_RUN_ERROR);
    }
  }

  private async executeFixCodeUntilItRuns(
    stateExecution: StateExecution
  ): Promise<void> {
    const { codeState } = stateExecution;

    switch (codeState.type) {
      case "success":
        stateExecution.log(
          "Code is already successful, moving to Feedback state",
          LogLevel.INFO
        );
        stateExecution.updateNextState(State.ADJUST_TO_FEEDBACK);
        return;
      case "noCode":
        stateExecution.log(
          "Unexpected code state in FIX_CODE_UNTIL_IT_RUNS. Doesn't have code. This should not be possible.",
          LogLevel.ERROR
        );
        //TODO: Roll back to previous state with code.
        stateExecution.updateNextState(State.GENERATE_CODE);
        return;
      case "formattingFailed":
      case "runFailed":
        const promptPair = editExistingSquiggleCodePrompt(
          codeState.code,
          codeState.error
        );
        const completion = await this.processLLMResponse(
          promptPair,
          stateExecution
        );
        if (completion) {
          await completionContentToCodeState(
            completion,
            stateExecution.codeState,
            "diff"
          );
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
      adjustToFeedbackPrompt(this.prompt, runResult.bindings, runResult.result),
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
      const completion = await runLLM([
        ...this.stateManager.getRelevantPreviousConversationMessages(3),
        {
          role: "user",
          content: promptPair.fullPrompt,
        },
      ]);

      stateExecution.log(
        "```json \n" + JSON.stringify(completion, null, 2) + "\n```",
        LogLevel.INFO
      );

      stateExecution.updateLlmMetrics({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
      });

      if (!completion?.content) {
        stateExecution.log(
          "Received an empty response from the API",
          LogLevel.ERROR
        );
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
      stateExecution.log(
        `Error in processLLMResponse: ${error.message}`,
        LogLevel.ERROR
      );
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
      stateExecution.log(
        "LLM determined no adjustment is needed",
        LogLevel.INFO
      );
      stateExecution.updateNextState(State.DONE);
      return;
    }

    stateExecution.log(`LLM response: ${trimmedResponse}`, LogLevel.INFO);

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
        stateExecution.log("FAIL: " + diffResponse.value, LogLevel.ERROR);
        stateExecution.updateNextState(State.FIX_CODE_UNTIL_IT_RUNS);
        return;
      }

      const { codeState: adjustedCodeState } =
        await squiggleCodeToCodeStateViaRunningAndFormatting(
          diffResponse.value
        );
      stateExecution.logCodeState(adjustedCodeState);
      stateExecution.updateCodeState(adjustedCodeState);
      stateExecution.updateNextState(codeStateNextState(adjustedCodeState));
    } else {
      // If there's no content to process, consider it as no adjustment needed
      stateExecution.log(
        "No adjustments provided, considering process complete",
        LogLevel.INFO
      );
      stateExecution.updateNextState(State.DONE);
    }
  }
}

export interface SquiggleResult {
  isValid: boolean;
  code: string;
  logs: LogEntry[];
}

export const runSquiggleGenerator = async (
  prompt: string
): Promise<SquiggleResult> => {
  const generator = new SquiggleGenerator(prompt);
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
