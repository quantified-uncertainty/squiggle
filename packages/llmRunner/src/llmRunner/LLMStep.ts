import { SqError, SqProject } from "@quri/squiggle-lang";

import { LlmMetrics, Message } from "./LLMClient";
import { LogEntry, Logger, TimestampedLogEntry } from "./Logger";
import { PromptPair } from "./prompts";
import { StateManager } from "./StateManager";

export enum State {
  START,
  GENERATE_CODE,
  FIX_CODE_UNTIL_IT_RUNS,
  ADJUST_TO_FEEDBACK,
  DONE,
  CRITICAL_ERROR,
}

export type CodeState =
  | { type: "noCode" }
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

export interface StateHandler {
  execute: (step: LLMStep) => Promise<void>;
}

// Workflow step that requests the LLM to generate code, fix code, etc.
export class LLMStep {
  public nextState: State;
  public durationMs?: number;
  private logger: Logger;
  private conversationMessages: Message[] = [];
  public llmMetricsList: LlmMetrics[] = [];
  private startTime: number;

  constructor(
    public readonly state: State,
    public codeState: CodeState,
    public readonly stateManager: StateManager
  ) {
    this.startTime = Date.now();
    this.nextState = state;
    this.logger = new Logger();
    this.logCodeState(codeState);
  }

  log(log: LogEntry): void {
    this.logger.log(log);
  }

  addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  updateCodeState(codeState: CodeState): void {
    this.codeState = codeState;
    this.logCodeState(codeState);
  }

  updateNextState(nextState: State): void {
    this.nextState = nextState;
  }

  complete() {
    this.durationMs = Date.now() - this.startTime;
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logger.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  criticalError(error: string) {
    this.log({ type: "error", message: error });
    this.updateNextState(State.CRITICAL_ERROR);
    this.complete();
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
}
