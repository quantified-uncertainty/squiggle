// stateManager.ts

import { Message } from "./llmConfig";

export enum LogLevel {
  INFO,
  WARN,
  ERROR,
  SUCCESS,
  HIGHLIGHT,
}

export interface LogEntry {
  message: string;
  timestamp: Date;
  level: LogLevel;
}

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
  | { type: "runFailed"; code: string; error: string }
  | { type: "success"; code: string };

export interface LlmMetrics {
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
}

export interface StateHandler {
  execute: (stateExecution: StateExecution) => Promise<void>;
}

export class StateExecution {
  public nextState: State;
  public durationMs?: number;
  private logs: LogEntry[] = [];
  private conversationMessages: Message[] = [];
  public llmMetrics: LlmMetrics = {
    apiCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
  };

  constructor(
    public readonly stateExecutionId: number,
    public readonly state: State,
    public codeState: CodeState,
    private readonly startTime: number = Date.now()
  ) {
    this.nextState = state;
  }

  log(message: string, level: LogLevel): void {
    const logEntry: LogEntry = {
      message,
      timestamp: new Date(),
      level,
    };
    console.log(level, message);
    this.logs.push(logEntry);
  }

  addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  updateCodeState(codeState: CodeState): void {
    this.codeState = codeState;
  }

  updateLlmMetrics(metrics: Partial<LlmMetrics>): void {
    this.llmMetrics = { ...this.llmMetrics, ...metrics };
  }

  updateNextState(nextState: State): void {
    this.nextState = nextState;
  }

  complete() {
    this.durationMs = Date.now() - this.startTime;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  criticalError(error: string) {
    this.log(error, LogLevel.ERROR);
    this.updateNextState(State.CRITICAL_ERROR);
  }
}

export class StateManager {
  private stateExecutions: StateExecution[] = [];
  private stateHandlers: Map<State, StateHandler> = new Map();
  private currentExecutionId: number = 0;
  private stepLimit: number;
  private durationLimitMs: number;
  private startTime: number;

  constructor(stepLimit: number = 10, durationLimitMinutes: number = 2) {
    this.registerDefaultHandlers();
    this.stepLimit = stepLimit;
    this.durationLimitMs = durationLimitMinutes * 1000 * 60;
    this.startTime = Date.now();
  }

  private registerDefaultHandlers() {
    this.registerStateHandler(State.START, {
      execute: async (stateExecution) => {
        stateExecution.updateNextState(State.GENERATE_CODE);
      },
    });

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
    if (this.stateExecutions.length >= this.stepLimit) {
      return this.transitionToCriticalError("Step limit exceeded");
    }

    if (Date.now() - this.startTime > this.durationLimitMs) {
      return this.transitionToCriticalError("Duration limit exceeded");
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
      stateExecution.log(
        `Unexpected error in state ${State[stateExecution.state]}: ${error.message}`,
        LogLevel.ERROR
      );
      stateExecution.updateNextState(State.CRITICAL_ERROR);
    }

    console.log("Finishing state", stateExecution);
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
    stateExecution.log(reason, LogLevel.ERROR);
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

  getAllMetrics(): LlmMetrics {
    return this.stateExecutions.reduce(
      (acc, execution) => ({
        apiCalls: acc.apiCalls + execution.llmMetrics.apiCalls,
        inputTokens: acc.inputTokens + execution.llmMetrics.inputTokens,
        outputTokens: acc.outputTokens + execution.llmMetrics.outputTokens,
      }),
      { apiCalls: 0, inputTokens: 0, outputTokens: 0 }
    );
  }

  getFinalResult(): { isValid: boolean; code: string; logs: LogEntry[] } {
    const finalExecution = this.getCurrentStateExecution();
    if (!finalExecution) {
      throw new Error("No state executions found");
    }

    const isValid = finalExecution.nextState === State.DONE;
    const code =
      finalExecution.codeState.type !== "noCode" &&
      finalExecution.codeState.code;

    return {
      isValid,
      code,
      logs: this.getLogs(),
    };
  }

  log(message: string, level: LogLevel) {
    const currentExecution = this.getCurrentStateExecution();
    if (currentExecution) {
      currentExecution.log(message, level);
    } else {
      console.log(`[${level}] ${message}`);
    }
  }

  getLogs(): LogEntry[] {
    return this.stateExecutions.flatMap((r) => r.getLogs());
  }

  getConversationMessages(): Message[] {
    return this.stateExecutions.flatMap((r) => r.getConversationMessages());
  }

  getStateExecutions(): StateExecution[] {
    return this.stateExecutions;
  }

  private getNextExecutionId(): number {
    return ++this.currentExecutionId;
  }
}
