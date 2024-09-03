// stateManager.ts

import chalk from "chalk";

import { SqError, SqProject } from "@quri/squiggle-lang";

import {
  calculatePriceMultipleCalls,
  LlmMetrics,
  LLMName,
  Message,
} from "./llmHelper";

export type LogEntry =
  | InfoLogEntry
  | WarnLogEntry
  | ErrorLogEntry
  | CodeRunErrorLogEntry
  | SuccessLogEntry
  | HighlightLogEntry
  | LlmResponseLogEntry
  | CodeStateLogEntry;

export function getLogEntryFullName(entry: LogEntry): string {
  switch (entry.type) {
    case "info":
      return "ℹ️ Information";
    case "warn":
      return "⚠️ Warning";
    case "error":
      return "🚫 System Error";
    case "codeRunError":
      return "❌ Code Run Error";
    case "success":
      return "✅ Success";
    case "highlight":
      return "🔆 Highlight";
    case "llmResponse":
      return "🤖 LLM Response";
    case "codeState":
      return "📄 Code State";
    default:
      return "❓ Unknown";
  }
}

export type TimestampedLogEntry = {
  timestamp: Date;
  entry: LogEntry;
};

export type InfoLogEntry = {
  type: "info";
  message: string;
};

export type WarnLogEntry = {
  type: "warn";
  message: string;
};

export type ErrorLogEntry = {
  type: "error";
  message: string;
};

export type CodeRunErrorLogEntry = {
  type: "codeRunError";
  error: string;
};

export type SuccessLogEntry = {
  type: "success";
  message: string;
};

export type HighlightLogEntry = {
  type: "highlight";
  message: string;
};

export type LlmResponseLogEntry = {
  type: "llmResponse";
  response: any; // JSON response
  content: string;
  messages: Message[];
  prompt: string;
};

export type CodeStateLogEntry = {
  type: "codeState";
  codeState: CodeState;
};

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
  execute: (stateExecution: StateExecution) => Promise<void>;
}

export class StateExecution {
  public nextState: State;
  public durationMs?: number;
  private logs: TimestampedLogEntry[] = [];
  private conversationMessages: Message[] = [];
  public llmMetricsList: LlmMetrics[] = [];

  constructor(
    public readonly stateExecutionId: number,
    public readonly state: State,
    public codeState: CodeState,
    private readonly startTime: number = Date.now()
  ) {
    this.nextState = state;
    this.logCodeState(codeState);
  }

  log(log: LogEntry): void {
    this.logs.push({ timestamp: new Date(), entry: log });
    this.displayLog(log);
  }

  private displayLog(log: LogEntry): void {
    switch (log.type) {
      case "info":
        console.log(chalk.blue(`[INFO] ${log.message}`));
        break;
      case "warn":
        console.warn(chalk.yellow(`[WARN] ${log.message}`));
        break;
      case "error":
        console.error(chalk.red(`[ERROR] ${log.message}`));
        break;
      case "codeRunError":
        console.error(chalk.red.bold(`[CODE_RUN_ERROR] ${log.error}`));
        break;
      case "success":
        console.log(chalk.green(`[SUCCESS] ${log.message}`));
        break;
      case "highlight":
        console.log(chalk.magenta(`[HIGHLIGHT] ${log.message}`));
        break;
      case "llmResponse":
        console.log(chalk.cyan(`[LLM_RESPONSE] ${log.content}`));
        break;
      case "codeState":
        console.log(chalk.gray(`[CODE_STATE] ${log.codeState.type}`));
        break;
      default:
        throw log satisfies never;
    }
  }

  addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  updateCodeState(codeState: CodeState): void {
    this.codeState = codeState;
    this.logCodeState(codeState);
  }

  updateLlmMetrics(metrics: LlmMetrics): void {
    this.llmMetricsList.push(metrics);
  }

  updateNextState(nextState: State): void {
    this.nextState = nextState;
  }

  complete() {
    this.durationMs = Date.now() - this.startTime;
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  criticalError(error: string) {
    this.log({ type: "error", message: error });
    this.updateNextState(State.CRITICAL_ERROR);
  }

  logCodeState(codeState: CodeState) {
    return this.log({ type: "codeState", codeState });
  }
}

export class StateManager {
  private stateExecutions: StateExecution[] = [];
  private stateHandlers: Map<State, StateHandler> = new Map();
  private currentExecutionId: number = 0;
  private priceLimit: number;
  private durationLimitMs: number;
  private startTime: number;

  constructor(priceLimit: number = 0.5, durationLimitMinutes: number = 5) {
    this.registerDefaultHandlers();
    this.priceLimit = priceLimit;
    this.durationLimitMs = durationLimitMinutes * 1000 * 60;
    this.startTime = Date.now();
  }

  private registerDefaultHandlers() {
    this.registerStateHandler(State.DONE, {
      execute: async (stateExecution) => {
        stateExecution.updateNextState(State.DONE);
      },
    });

    this.registerStateHandler(State.CRITICAL_ERROR, {
      execute: async (stateExecution) => {
        stateExecution.updateNextState(State.CRITICAL_ERROR);
      },
    });
  }

  registerStateHandler(state: State, handler: StateHandler) {
    this.stateHandlers.set(state, handler);
  }

  private createNewStateExecution(): StateExecution {
    const previousExecution = this.getCurrentStateExecution();
    const currentState = previousExecution?.nextState ?? State.START;
    const initialCodeState = previousExecution?.codeState ?? { type: "noCode" };

    const newExecution = new StateExecution(
      this.getNextExecutionId(),
      currentState,
      initialCodeState
    );
    this.stateExecutions.push(newExecution);
    return newExecution;
  }

  async step(): Promise<{
    continueExecution: boolean;
    stateExecution: StateExecution;
  }> {
    if (Date.now() - this.startTime > this.durationLimitMs) {
      return this.transitionToCriticalError(
        `Duration limit of ${this.durationLimitMs / 1000} minutes exceeded`
      );
    }

    if (this.priceSoFar() > this.priceLimit) {
      return this.transitionToCriticalError(
        `Price limit of $${this.priceLimit.toFixed(2)} exceeded`
      );
    }

    const stateExecution = this.createNewStateExecution();

    try {
      const handler = this.stateHandlers.get(stateExecution.state);
      if (handler) {
        await handler.execute(stateExecution);
        stateExecution.complete();
      } else {
        throw new Error(
          `No handler registered for state ${State[stateExecution.state]}`
        );
      }
    } catch (error) {
      stateExecution.log({
        type: "error",
        message: error instanceof Error ? error.message : "unknown",
      });
      stateExecution.updateNextState(State.CRITICAL_ERROR);
    }

    console.log(
      chalk.cyan(`Finishing state ${State[stateExecution.state]}`),
      stateExecution
    );

    return {
      continueExecution: !this.isProcessComplete(),
      stateExecution,
    };
  }

  private transitionToCriticalError(reason: string): {
    continueExecution: boolean;
    stateExecution: StateExecution;
  } {
    const stateExecution = this.createNewStateExecution();
    stateExecution.log({ type: "error", message: reason });
    stateExecution.updateNextState(State.CRITICAL_ERROR);
    stateExecution.complete();

    return {
      continueExecution: false,
      stateExecution,
    };
  }

  getCurrentStateExecution(): StateExecution | undefined {
    return this.stateExecutions.at(-1);
  }

  getCurrentState(): State {
    const currentExecution = this.getCurrentStateExecution();
    return currentExecution ? currentExecution.state : State.START;
  }

  isProcessComplete(): boolean {
    const currentState = this.getCurrentState();
    return currentState === State.DONE || currentState === State.CRITICAL_ERROR;
  }

  getFinalResult(): {
    isValid: boolean;
    code: string;
    logs: TimestampedLogEntry[];
  } {
    const finalExecution = this.getCurrentStateExecution();
    if (!finalExecution) {
      throw new Error("No state executions found");
    }

    const isValid = finalExecution.nextState === State.DONE;
    const code =
      finalExecution.codeState.type === "noCode"
        ? ""
        : finalExecution.codeState.code;

    return {
      isValid,
      code,
      logs: this.getLogs(),
    };
  }

  getLogs(): TimestampedLogEntry[] {
    return this.stateExecutions.flatMap((r) => r.getLogs());
  }

  getConversationMessages(): Message[] {
    return this.stateExecutions.flatMap((r) => r.getConversationMessages());
  }

  getStateExecutions(): StateExecution[] {
    return this.stateExecutions;
  }

  llmMetricSummary(): Record<LLMName, LlmMetrics> {
    return this.getStateExecutions().reduce(
      (acc, execution) => {
        execution.llmMetricsList.forEach((metrics) => {
          if (!acc[metrics.llmName]) {
            acc[metrics.llmName] = { ...metrics };
          } else {
            acc[metrics.llmName].apiCalls += metrics.apiCalls;
            acc[metrics.llmName].inputTokens += metrics.inputTokens;
            acc[metrics.llmName].outputTokens += metrics.outputTokens;
          }
        });
        return acc;
      },
      {} as Record<LLMName, LlmMetrics>
    );
  }

  getLlmMetrics(): { totalPrice: number; llmRunCount: number } {
    const metricsSummary = this.llmMetricSummary();
    const totalPrice = calculatePriceMultipleCalls(metricsSummary);
    const llmRunCount = Object.values(metricsSummary).reduce(
      (sum, metrics) => sum + metrics.apiCalls,
      0
    );
    return { totalPrice, llmRunCount };
  }

  private getNextExecutionId(): number {
    return ++this.currentExecutionId;
  }

  private findLastGenerateCodeIndex(): number {
    return this.stateExecutions.findLastIndex(
      (execution) => execution.state === State.GENERATE_CODE
    );
  }

  private getMessagesFromExecutions(executionIndexes: number[]): Message[] {
    return executionIndexes.flatMap((index) =>
      this.stateExecutions[index].getConversationMessages()
    );
  }

  private priceSoFar(): number {
    const currentMetrics = this.llmMetricSummary();
    return calculatePriceMultipleCalls(currentMetrics);
  }

  getRelevantPreviousConversationMessages(maxRecentExecutions = 3): Message[] {
    const getRelevantExecutionIndexes = (
      lastGenerateCodeIndex: number,
      maxRecentExecutions: number
    ): number[] => {
      const endIndex = this.stateExecutions.length - 1;
      const startIndex = Math.max(
        lastGenerateCodeIndex,
        endIndex - maxRecentExecutions + 1
      );
      return [
        lastGenerateCodeIndex,
        ...Array.from(
          { length: endIndex - startIndex + 1 },
          (_, i) => startIndex + i
        ),
      ].filter((index, i, arr) => index >= 0 && arr.indexOf(index) === i);
    };

    const lastGenerateCodeIndex = this.findLastGenerateCodeIndex();
    const relevantIndexes = getRelevantExecutionIndexes(
      lastGenerateCodeIndex,
      maxRecentExecutions
    );
    return this.getMessagesFromExecutions(relevantIndexes);
  }
}
