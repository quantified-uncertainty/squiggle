#!/usr/bin/env node
//main.ts
import { generateAndSaveSummary } from "./generateSummary";
import { runLLM } from "./llmConfig";
import { processSquiggleCode } from "./processSquiggleCode";
import {
  adjustToFeedbackPrompt,
  editExistingSquiggleCodePrompt,
  generateNewSquiggleCodePrompt,
} from "./prompts";
import {
  CodeState,
  LogEntry,
  LogLevel,
  State,
  StateExecution,
  StateManager,
} from "./stateManager";

/*
 * Extracts Squiggle code from the content string.
 */
function extractSquiggleCode(content: string): string {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

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
    const prompt = generateNewSquiggleCodePrompt(this.prompt);
    const completion = await this.processLLMResponse(prompt, stateExecution);
    if (completion) {
      await this.handleCodeGenerationResponse(completion, stateExecution);
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
          "Unexpected code state in FIX_CODE_UNTIL_IT_RUNS",
          LogLevel.ERROR
        );
        stateExecution.updateNextState(State.GENERATE_CODE);
        return;
      case "formattingFailed":
      case "runFailed":
        const prompt = editExistingSquiggleCodePrompt(
          codeState.code,
          codeState.error
        );
        const completion = await this.processLLMResponse(
          prompt,
          stateExecution
        );
        if (completion) {
          await this.handleCodeGenerationResponse(completion, stateExecution);
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
      await processSquiggleCode(currentCode);

    if (newCodeState.type !== "success" || !runResult) {
      stateExecution.criticalError(
        "Failed to process code in Adjust To Feedback stage"
      );
      return;
    }

    const { bindings, result } = runResult;
    const prompt = adjustToFeedbackPrompt(bindings, result);

    const completion = await this.processLLMResponse(prompt, stateExecution);
    if (completion) {
      await this.handleAdjustToFeedbackResponse(completion, stateExecution);
    }
  }

  private async processLLMResponse(
    llmPrompt: string,
    stateExecution: StateExecution
  ): Promise<string | null> {
    try {
      stateExecution.addConversationMessage({
        role: "user",
        content: llmPrompt,
      });

      const completion = await runLLM(
        this.stateManager.getConversationMessages()
      );

      stateExecution.updateLlmMetrics({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
      });

      stateExecution.addConversationMessage({
        role: "assistant",
        content: completion?.content ?? "no response",
      });

      if (!completion?.content) {
        stateExecution.log(
          "Received an empty response from the API",
          LogLevel.ERROR
        );
        return null;
      }

      stateExecution.log(JSON.stringify(completion, null, 2), LogLevel.INFO);
      stateExecution.log(`✨ Got response from OpenRouter`, LogLevel.HIGHLIGHT);

      return completion.content;
    } catch (error: any) {
      stateExecution.log(
        `Error in processLLMResponse: ${error.message}`,
        LogLevel.ERROR
      );
      return null;
    }
  }

  private async handleCodeGenerationResponse(
    completionContent: string,
    stateExecution: StateExecution
  ): Promise<void> {
    const extractedCode = extractSquiggleCode(completionContent);
    if (!extractedCode) {
      stateExecution.log(
        "Error generating/fixing Squiggle code. Didn't get code.",
        LogLevel.ERROR
      );
      stateExecution.updateCodeState({ type: "noCode" });
      stateExecution.updateNextState(State.GENERATE_CODE);
      return;
    }

    const { codeState } = await processSquiggleCode(extractedCode);
    stateExecution.updateCodeState(codeState);
    stateExecution.updateNextState(codeStateNextState(codeState));
  }

  private async handleAdjustToFeedbackResponse(
    completionContent: string,
    stateExecution: StateExecution
  ): Promise<void> {
    const trimmedResponse = completionContent.trim();
    const noAdjustmentRegex = /no\s+adjust(?:ment)?\s+needed/i;
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
    const extractedCode = extractSquiggleCode(trimmedResponse);

    if (!extractedCode) {
      stateExecution.log(
        "No code adjustments provided. Considering process complete.",
        LogLevel.INFO
      );
      stateExecution.updateNextState(State.DONE);
      return;
    }

    const { codeState: adjustedCodeState } =
      await processSquiggleCode(extractedCode);
    stateExecution.updateCodeState(adjustedCodeState);
    stateExecution.updateNextState(codeStateNextState(adjustedCodeState));
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

    generateAndSaveSummary(generator.stateManager);

    return generator.stateManager.getFinalResult();
  } catch (error) {
    const stateExecution = generator.stateManager.getCurrentStateExecution();
    stateExecution.criticalError(
      "runSquiggleGenerator error:" + error.toString()
    );

    generateAndSaveSummary(generator.stateManager);

    throw error;
  }
};
