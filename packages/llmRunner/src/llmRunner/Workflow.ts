import chalk from "chalk";

import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  LLMName,
  Message,
} from "./LLMClient";
import { Inputs, LLMStepInstance, LLMStepTemplate, StepShape } from "./LLMStep";
import { TimestampedLogEntry } from "./Logger";
import { LlmConfig } from "./squiggleGenerator";

export class Workflow {
  private steps: LLMStepInstance[] = [];
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

  addStep<S extends StepShape>(
    template: LLMStepTemplate<S>,
    inputs: Inputs<S>
  ): LLMStepInstance<S> {
    const step = template.instantiate(this, inputs);
    this.steps.push(step as unknown as LLMStepInstance);
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

    console.log(chalk.cyan(`Finishing state ${step.template.name}`));

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

  getSteps(): LLMStepInstance[] {
    return this.steps;
  }

  private getCurrentStep(): LLMStepInstance | undefined {
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

    // look for first code output
    let code = "";
    const outputs = finalStep.getAllOutputs();
    for (const output of Object.values(outputs)) {
      if (output?.kind === "code") {
        code = output.value;
      } else if (output?.kind === "codeState") {
        code = output.value.code;
      }
    }

    return {
      isValid,
      code,
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
    const lastGenerateCodeIndex = this.steps.findLastIndex((step) => {
      const hasCodeInput = Object.values(step.template.shape.inputs).some(
        (kind) => kind === "code" || kind === "codeState"
      );

      const hasCodeOutput = Object.values(step.template.shape.outputs).some(
        (kind) => kind === "code" || kind === "codeState"
      );

      return !hasCodeInput && hasCodeOutput;
    });

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
