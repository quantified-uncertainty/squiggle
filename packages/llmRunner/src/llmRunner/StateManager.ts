import chalk from "chalk";

import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  LLMName,
  Message,
} from "./LLMClient";
import { Kind, LLMStep, LLMStepDescription } from "./LLMStep";
import { TimestampedLogEntry } from "./Logger";
import { LlmConfig } from "./squiggleGenerator";

export class StateManager {
  private steps: LLMStep[] = [];
  private priceLimit: number;
  private durationLimitMs: number;
  private startTime: number;

  public llmClient: LLMClient;

  constructor(
    public llmConfig: LlmConfig,
    openaiApiKey?: string,
    anthropicApiKey?: string
  ) {
    this.priceLimit = llmConfig.priceLimit;
    this.durationLimitMs = llmConfig.durationLimitMinutes * 1000 * 60;
    this.startTime = Date.now();

    this.llmClient = new LLMClient(
      llmConfig.llmName,
      openaiApiKey,
      anthropicApiKey
    );
  }

  addStep(stepDescription: LLMStepDescription): LLMStep {
    const step = new LLMStep(
      stepDescription.state,
      this,
      stepDescription.execute
    );
    this.steps.push(step);
    return step;
  }

  async runNextStep(): Promise<{
    continueExecution: boolean;
  }> {
    if (this.checkResourceLimits()) {
      return { continueExecution: false };
    }

    const step = this.getCurrentStep();

    if (!step) {
      return { continueExecution: false };
    }

    await step.run();

    console.log(chalk.cyan(`Finishing state ${Kind[step.kind]}`), step);

    return {
      continueExecution: !this.isProcessComplete(),
    };
  }

  checkResourceLimits(): string | undefined {
    if (Date.now() - this.startTime > this.durationLimitMs) {
      return `Duration limit of ${this.durationLimitMs / 1000 / 60} minutes exceeded`;
    }

    if (this.priceSoFar() > this.priceLimit) {
      return `Price limit of $${this.priceLimit.toFixed(2)} exceeded`;
    }
    return undefined;
  }

  getSteps(): LLMStep[] {
    return this.steps;
  }

  private getCurrentStep(): LLMStep | undefined {
    return this.steps.at(-1);
  }

  getLogs(): TimestampedLogEntry[] {
    return this.steps.flatMap((r) => r.getLogs());
  }

  private isProcessComplete(): boolean {
    const currentStepState = this.getCurrentStep()?.getState();
    return currentStepState !== "PENDING";
  }

  getFinalResult(): {
    isValid: boolean;
    code: string;
    logs: TimestampedLogEntry[];
  } {
    const finalStep = this.getCurrentStep();
    if (!finalStep) {
      throw new Error("No steps found");
    }

    const isValid = finalStep.getState() === "DONE";

    return {
      isValid,
      code: finalStep.getCode() ?? "",
      logs: this.getLogs(),
    };
  }

  llmMetricSummary(): Record<LLMName, LlmMetrics> {
    return this.getSteps().reduce(
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

  private getMessagesFromSteps(stepIndices: number[]): Message[] {
    return stepIndices.flatMap((index) =>
      this.steps[index].getConversationMessages()
    );
  }

  private priceSoFar(): number {
    const currentMetrics = this.llmMetricSummary();
    return calculatePriceMultipleCalls(currentMetrics);
  }

  getRelevantPreviousConversationMessages(maxRecentSteps = 3): Message[] {
    const lastGenerateCodeIndex = this.steps.findLastIndex(
      (execution) => execution.kind === Kind.GENERATE_CODE
    );

    const getRelevantStepIndexes = (): number[] => {
      const endIndex = this.steps.length - 1;
      const startIndex = Math.max(
        lastGenerateCodeIndex,
        endIndex - maxRecentSteps + 1
      );
      return [
        lastGenerateCodeIndex,
        ...Array.from(
          { length: endIndex - startIndex + 1 },
          (_, i) => startIndex + i
        ),
      ].filter((index, i, arr) => index >= 0 && arr.indexOf(index) === i);
    };
    const relevantIndexes = getRelevantStepIndexes();

    return this.getMessagesFromSteps(relevantIndexes);
  }
}
