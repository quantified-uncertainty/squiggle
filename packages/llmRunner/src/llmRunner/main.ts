import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { generateSummary } from "./generateSummary";
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
  llmName: "Claude-Sonnet",
  priceLimit: 0.2,
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
  | { type: "Edit"; prompt: string; code: string };

export class SquiggleGenerator {
  public stateManager: StateManager;
  private prompt: string;
  private llmConfig: LlmConfig;
  private startTime: number;
  private isDone: boolean = false;
  private abortSignal?: AbortSignal; // TODO - unused
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;

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
    this.prompt = input.prompt;
    this.llmConfig = llmConfig ?? llmConfigDefault;
    this.abortSignal = abortSignal;
    this.stateManager = new StateManager(
      this.llmConfig.priceLimit,
      this.llmConfig.durationLimitMinutes
    );

    this.startTime = Date.now();
    this.registerStateHandlers();

    if (openaiApiKey) {
      this.openaiClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openaiApiKey,
      });
    }

    if (anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: anthropicApiKey,
      });
    }

    if (input.type === "Create") {
      this.stateManager.registerStateHandler(State.START, {
        execute: async (stateExecution) => {
          stateExecution.updateNextState(State.GENERATE_CODE);
        },
      });
    } else {
      this.stateManager.registerStateHandler(State.START, {
        execute: async (stateExecution) => {
          const { codeState } =
            await squiggleCodeToCodeStateViaRunningAndFormatting(input.code);
          this.stateManager
            .getCurrentStateExecution()!
            .updateCodeState(codeState);
          stateExecution.updateNextState(codeStateNextState(codeState));
        },
      });
    }
  }

  async step(): Promise<boolean> {
    if (this.isDone) {
      return true;
    }

    const { continueExecution } = await this.stateManager.step();

    if (!continueExecution) {
      this.isDone = true;
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

    if (completion) {
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

    const currentCode = codeState.code;
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

  private getOpenAIClient(): OpenAI {
    if (!this.openaiClient) {
      throw new Error("OpenAI client is not initialized");
    }
    return this.openaiClient;
  }

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      throw new Error("Anthropic client is not initialized");
    }
    return this.anthropicClient;
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
      const completion = await runLLM(messagesToSend, this.llmConfig.llmName, {
        getOpenAIClient: () => this.getOpenAIClient(),
        getAnthropicClient: () => this.getAnthropicClient(),
      });

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
    } catch (error) {
      stateExecution.log({
        type: "error",
        message: `Error in processLLMResponse: ${error instanceof Error ? error.message : error}`,
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
      stateExecution.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      stateExecution.updateNextState(State.DONE);
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
