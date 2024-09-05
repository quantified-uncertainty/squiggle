import { SqError, SqProject } from "@quri/squiggle-lang";

import { LlmMetrics, Message } from "./LLMClient";
import { LogEntry, Logger, TimestampedLogEntry } from "./Logger";
import { PromptPair } from "./prompts";
import { StateManager } from "./StateManager";

export enum Kind {
  START,
  GENERATE_CODE,
  FIX_CODE_UNTIL_IT_RUNS,
  ADJUST_TO_FEEDBACK,
  CRITICAL_ERROR,
}

export type CodeState =
  | {
      type: "formattingFailed";
      error: string;
      code: string;
    }
  | { type: "runFailed"; code: string; error: SqError; project: SqProject }
  | { type: "success"; code: string };

export function codeStateErrorString(codeState: CodeState): string {
  if (codeState.type === "formattingFailed") {
    return codeState.error;
  } else if (codeState.type === "runFailed") {
    return codeState.error.toStringWithDetails();
  }
  return "";
}

export type LLMStepDescription = {
  state: Kind; // basically "name", could be a string
  execute: (step: LLMStep) => Promise<
    // execute can produce code
    | {
        code: string;
      }
    | undefined
  >;
};

// Workflow step that requests the LLM to generate code, fix code, etc.
export class LLMStep {
  public durationMs?: number;
  private logger: Logger;
  private conversationMessages: Message[] = [];
  public llmMetricsList: LlmMetrics[] = [];
  private startTime: number;
  private state: "PENDING" | "DONE" | "FAILED" = "PENDING";
  private code: string | undefined;

  constructor(
    public readonly kind: Kind,
    public readonly stateManager: StateManager,
    private execute: LLMStepDescription["execute"]
  ) {
    this.startTime = Date.now();
    this.logger = new Logger();
  }

  log(log: LogEntry): void {
    this.logger.log(log);
  }

  addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logger.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  criticalError(error: string) {
    this.log({ type: "error", message: error });
    this.updateDuration();
    this.state = "FAILED";
  }

  private updateDuration() {
    this.durationMs = Date.now() - this.startTime;
  }

  private complete() {
    this.updateDuration();
    this.state = "DONE";
  }

  logCodeState(codeState: CodeState) {
    return this.logger.log({ type: "codeState", codeState });
  }

  async queryLLM(promptPair: PromptPair): Promise<string | null> {
    try {
      const manager = this.stateManager;
      const messagesToSend: Message[] = [
        ...manager.getRelevantPreviousConversationMessages(
          manager.llmConfig.messagesInHistoryToKeep
        ),
        {
          role: "user",
          content: promptPair.fullPrompt,
        },
      ];
      const completion = await manager.llmClient.run(messagesToSend);

      this.log({
        type: "llmResponse",
        response: completion,
        content: completion.content,
        messages: messagesToSend,
        prompt: promptPair.fullPrompt,
      });

      this.llmMetricsList.push({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
        llmName: manager.llmConfig.llmName,
      });

      if (!completion?.content) {
        this.log({
          type: "error",
          message: "Received an empty response from the API",
        });
        return null;
      } else {
        this.addConversationMessage({
          role: "user",
          content: promptPair.summarizedPrompt,
        });

        this.addConversationMessage({
          role: "assistant",
          content: completion?.content ?? "no response",
        });
      }

      return completion.content;
    } catch (error) {
      this.log({
        type: "error",
        message: `Error in processLLMResponse: ${error instanceof Error ? error.message : error}`,
      });
      return null;
    }
  }

  async run() {
    if (this.state !== "PENDING") {
      return;
    }

    const limits = this.stateManager.checkResourceLimits();
    if (limits) {
      this.criticalError(limits);
      return;
    }

    try {
      const result = await this.execute(this);
      if (result?.code) {
        this.code = result.code;
      }
    } catch (error) {
      this.criticalError(
        error instanceof Error ? error.message : String(error)
      );
      return;
    }
    this.complete();
  }

  getState() {
    return this.state;
  }

  getCode() {
    return this.code;
  }
}
