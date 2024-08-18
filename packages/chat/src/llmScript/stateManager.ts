// stateManager.ts

import { Message } from "./llmConfig";
import { LogEntry, LogLevel, LogManager } from "./logManager";

export enum State {
  START,
  GENERATE_CODE,
  ENSURE_CODE_RUNS,
  GET_FEEDBACK_FROM_RUN,
  DONE,
  CRITICAL_ERROR,
}

export type CodeState =
  | { type: "noCode" }
  | { type: "codeGenerated"; code: string; errors: string[] };

export interface PerformanceMetrics {
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

const emptyMetrics: PerformanceMetrics = {
  apiCalls: 0,
  inputTokens: 0,
  outputTokens: 0,
  durationMs: 0,
};

export interface StateHistoryEntry {
  state: State;
  executionId: number;
  codeState: CodeState;
  performanceMetrics: PerformanceMetrics;
  logs: LogEntry[];
}

export interface StateContext {
  prompt: string;
  maxAttempts: number;
}

export interface StateHandler {
  execute: (
    manager: StateManager,
    context: StateContext
  ) => Promise<{
    codeState: CodeState;
    performanceMetrics: PerformanceMetrics;
  }>;
}

export interface ExecutionSummary {
  totalPerformanceMetrics: PerformanceMetrics;
  stateTransitions: { from: State; to: State; duration: number }[];
  logSummary: {
    total: number;
    byLevel: { [key in LogLevel]: number };
    topMessages: string[];
  };
}

export class StateManager {
  private currentState: State = State.START;
  private stateHistory: StateHistoryEntry[] = [];
  private logManager: LogManager;
  private stateHandlers: Map<State, StateHandler> = new Map();
  private isCancelled: boolean = false;
  private attempts: number = 0;
  private conversationHistory: Message[] = [];

  constructor() {
    this.logManager = new LogManager();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    this.registerStateHandler(State.START, {
      execute: async (manager) => {
        manager.transitionTo(State.GENERATE_CODE);
        return {
          codeState: { type: "noCode" },
          performanceMetrics: emptyMetrics,
        };
      },
    });

    this.registerStateHandler(State.DONE, {
      execute: async () => {
        const lastEntry = this.stateHistory.at(-1);
        return {
          codeState: lastEntry ? lastEntry.codeState : { type: "noCode" },
          performanceMetrics: emptyMetrics,
        };
      },
    });

    this.registerStateHandler(State.CRITICAL_ERROR, {
      execute: async () => {
        const lastEntry = this.stateHistory.at(-1);
        return {
          codeState: lastEntry ? lastEntry.codeState : { type: "noCode" },
          performanceMetrics: emptyMetrics,
        };
      },
    });
  }

  registerStateHandler(state: State, handler: StateHandler) {
    this.stateHandlers.set(state, handler);
  }

  async next(context: StateContext): Promise<boolean> {
    if (this.isCancelled) {
      this.transitionTo(State.CRITICAL_ERROR);
      return false;
    }

    const startTime = Date.now();
    const executionId = this.logManager.startNewExecution();

    let result: {
      codeState: CodeState;
      performanceMetrics: PerformanceMetrics;
    };
    try {
      const handler = this.stateHandlers.get(this.currentState);
      if (handler) {
        result = await handler.execute(this, context);
      } else {
        throw new Error(
          `No handler registered for state ${State[this.currentState]}`
        );
      }
    } catch (error) {
      this.log(
        `Unexpected error in state ${State[this.currentState]}: ${error.message}`,
        LogLevel.ERROR
      );
      this.transitionTo(State.CRITICAL_ERROR);
      result = {
        codeState: { type: "noCode" },
        performanceMetrics: emptyMetrics,
      };
    }

    const duration = Date.now() - startTime;
    const logs = this.logManager.getLogs(executionId);
    this.addStateHistory(
      executionId,
      result.codeState,
      result.performanceMetrics,
      logs
    );

    return (
      this.currentState !== State.DONE &&
      this.currentState !== State.CRITICAL_ERROR
    );
  }

  transitionTo(newState: State): void {
    this.log(
      `Transitioning from ${State[this.currentState]} to ${State[newState]}`,
      LogLevel.INFO
    );
    this.currentState = newState;
  }

  getCurrentState(): State {
    return this.currentState;
  }

  addStateHistory(
    executionId: number,
    codeState: CodeState,
    performanceMetrics: PerformanceMetrics,
    logs: LogEntry[]
  ) {
    this.stateHistory.push({
      state: this.currentState,
      executionId,
      codeState,
      performanceMetrics,
      logs,
    });
  }

  getStateHistory(): StateHistoryEntry[] {
    return this.stateHistory;
  }

  log(message: string, level: LogLevel) {
    this.logManager.log(message, level);
  }

  getLogs(executionId?: number) {
    return this.logManager.getLogs(executionId);
  }

  getLatestLogs(count: number) {
    return this.logManager.getLatestLogs(count);
  }

  cancel() {
    this.isCancelled = true;
  }

  reset() {
    this.currentState = State.START;
    this.stateHistory = [];
    this.attempts = 0;
    this.isCancelled = false;
    this.conversationHistory = [];
  }

  incrementAttempts() {
    this.attempts++;
  }

  getAttempts() {
    return this.attempts;
  }

  setConversationHistory(history: Message[]) {
    this.conversationHistory = history;
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  recentHistoryEntry() {
    return this.getConversationHistory().at(-1);
  }

  getLatestStateEntry(): StateHistoryEntry | undefined {
    return this.stateHistory.at(-1);
  }

  getTotalPerformanceMetrics(): PerformanceMetrics {
    return this.stateHistory.reduce(
      (total, entry) => ({
        apiCalls: total.apiCalls + entry.performanceMetrics.apiCalls,
        inputTokens: total.inputTokens + entry.performanceMetrics.inputTokens,
        outputTokens:
          total.outputTokens + entry.performanceMetrics.outputTokens,
        durationMs: total.durationMs + entry.performanceMetrics.durationMs,
      }),
      { ...emptyMetrics }
    );
  }

  getExecutionSummary(): ExecutionSummary {
    const totalPerformanceMetrics = this.getTotalPerformanceMetrics();

    const stateTransitions = this.stateHistory.slice(1).map((entry, index) => ({
      from: this.stateHistory[index].state,
      to: entry.state,
      duration: entry.performanceMetrics.durationMs,
    }));

    const allLogs = this.stateHistory.flatMap((entry) => entry.logs);
    const logSummary = {
      total: allLogs.length,
      byLevel: allLogs.reduce(
        (acc, log) => {
          acc[log.level] = (acc[log.level] || 0) + 1;
          return acc;
        },
        {} as { [key in LogLevel]: number }
      ),
      topMessages: allLogs
        .sort((a, b) => b.level - a.level)
        .slice(0, 5)
        .map((log) => `[${LogLevel[log.level]}] ${log.message}`),
    };

    return {
      totalPerformanceMetrics,
      stateTransitions,
      logSummary,
    };
  }
}
