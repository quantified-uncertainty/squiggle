import chalk from "chalk";

import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  LLMName,
  Message,
} from "./LLMClient";
import { LlmConfig } from "./main";
import {
  State,
  StateExecution,
  StateHandler,
  TimestampedLogEntry,
} from "./StateExecution";

export class StateManager {
  private stateExecutions: StateExecution[] = [];
  private stateHandlers: Map<State, StateHandler> = new Map();
  private currentExecutionId: number = 0;
  private priceLimit: number;
  private durationLimitMs: number;
  private startTime: number;

  public llmClient: LLMClient;

  constructor(
    public llmConfig: LlmConfig,
    openaiApiKey?: string,
    anthropicApiKey?: string
  ) {
    this.registerDefaultHandlers();
    this.priceLimit = llmConfig.priceLimit;
    this.durationLimitMs = llmConfig.durationLimitMinutes * 1000 * 60;
    this.startTime = Date.now();

    this.llmClient = new LLMClient(
      llmConfig.llmName,
      openaiApiKey,
      anthropicApiKey
    );
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
      initialCodeState,
      this
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
        `Duration limit of ${this.durationLimitMs / 1000 / 60} minutes exceeded`
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
