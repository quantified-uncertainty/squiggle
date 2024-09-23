import chalk from "chalk";

import { generateSummary } from "../generateSummary.js";
import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  Message,
} from "../LLMClient.js";
import {
  Inputs,
  LLMStepInstance,
  LLMStepTemplate,
  StepShape,
} from "../LLMStep.js";
import { TimestampedLogEntry } from "../Logger.js";
import { LlmId } from "../modelConfigs.js";
import { WorkflowResult } from "../types.js";

export interface LlmConfig {
  llmId: LlmId;
  priceLimit: number;
  durationLimitMinutes: number;
  messagesInHistoryToKeep: number;
}

export const llmConfigDefault: LlmConfig = {
  llmId: "Claude-Sonnet",
  priceLimit: 0.3,
  durationLimitMinutes: 1,
  messagesInHistoryToKeep: 4,
};

export type WorkflowEventShape =
  | {
      type: "stepAdded";
      payload: {
        step: LLMStepInstance;
      };
    }
  | {
      type: "stepStarted";
      payload: {
        step: LLMStepInstance;
      };
    }
  | {
      type: "stepFinished";
      payload: {
        step: LLMStepInstance;
      };
    }
  | {
      type: "allStepsFinished";
      payload?: undefined;
    };

export type WorkflowEventType = WorkflowEventShape["type"];

export class WorkflowEvent<T extends WorkflowEventType> extends Event {
  constructor(
    type: T,
    public workflow: Workflow,
    public data: Extract<WorkflowEventShape, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type WorkflowEventListener<T extends WorkflowEventType> = (
  event: WorkflowEvent<T>
) => void;

/**
 * This class is responsible for managing the steps in a workflow.
 *
 * It does not make any assumptions about the steps themselves, it just
 * provides a way to add them and interact with them.
 *
 * See `ControlledWorkflow` for a common base class that controls the workflow
 * by injecting new steps based on events.
 */
export class Workflow {
  private steps: LLMStepInstance[] = [];
  private priceLimit: number;
  private durationLimitMs: number;
  private startTime: number;

  public llmClient: LLMClient;

  constructor(
    public llmConfig: LlmConfig = llmConfigDefault,
    openaiApiKey?: string,
    anthropicApiKey?: string
  ) {
    this.priceLimit = llmConfig.priceLimit;
    this.durationLimitMs = llmConfig.durationLimitMinutes * 1000 * 60;
    this.startTime = Date.now();

    this.llmClient = new LLMClient(
      llmConfig.llmId,
      openaiApiKey,
      anthropicApiKey
    );
  }

  addStep<S extends StepShape>(
    template: LLMStepTemplate<S>,
    inputs: Inputs<S>
  ): LLMStepInstance<S> {
    // sorry for "any"; countervariance issues
    const step: LLMStepInstance<any> = template.instantiate(this, inputs);
    this.steps.push(step);
    this.dispatchEvent({
      type: "stepAdded",
      payload: { step },
    });
    return step;
  }

  private async runNextStep(): Promise<void> {
    const step = this.getCurrentStep();

    if (!step) {
      return;
    }

    this.dispatchEvent({
      // should we fire this after `run()` is called?
      type: "stepStarted",
      payload: { step },
    });
    await step.run();

    console.log(chalk.cyan(`Finishing step ${step.template.name}`));
    this.dispatchEvent({
      type: "stepFinished",
      payload: { step },
    });
  }

  async runUntilComplete() {
    while (!this.isProcessComplete()) {
      await this.runNextStep();
    }
    this.dispatchEvent({
      type: "allStepsFinished",
    });
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
    return this.getCurrentStep()?.getState().kind !== "PENDING";
  }

  getFinalResult(): WorkflowResult {
    const finalStep = this.getCurrentStep();
    if (!finalStep) {
      throw new Error("No steps found");
    }

    const isValid = finalStep.getState().kind === "DONE";

    // look for first code output in the last step that generated any code
    let code = "";
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      const outputs = step.getOutputs();
      for (const output of Object.values(outputs)) {
        if (output?.kind === "source") {
          code = output.value;
        } else if (output?.kind === "code") {
          code = output.value.source;
        }
      }
      if (code) break;
    }

    const endTime = Date.now();
    const runTimeMs = endTime - this.startTime;
    const { totalPrice, llmRunCount } = this.getLlmMetrics();

    return {
      code,
      isValid,
      totalPrice,
      runTimeMs,
      llmRunCount,
      logSummary: generateSummary(this),
    };
  }

  llmMetricSummary(): Record<LlmId, LlmMetrics> {
    return this.getSteps().reduce(
      (acc, step) => {
        step.llmMetricsList.forEach((metrics) => {
          if (!acc[metrics.LlmId]) {
            acc[metrics.LlmId] = { ...metrics };
          } else {
            acc[metrics.LlmId].apiCalls += metrics.apiCalls;
            acc[metrics.LlmId].inputTokens += metrics.inputTokens;
            acc[metrics.LlmId].outputTokens += metrics.outputTokens;
          }
        });
        return acc;
      },
      {} as Record<LlmId, LlmMetrics>
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
        (kind) => kind === "source" || kind === "code"
      );

      const hasCodeOutput = Object.values(step.template.shape.outputs).some(
        (kind) => kind === "source" || kind === "code"
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

  // Event methods

  private eventTarget = new EventTarget();

  private dispatchEvent(shape: WorkflowEventShape) {
    this.eventTarget.dispatchEvent(
      new WorkflowEvent(shape.type, this, shape.payload)
    );
  }

  addEventListener<T extends WorkflowEventType>(
    type: T,
    listener: WorkflowEventListener<T>
  ) {
    this.eventTarget.addEventListener(type, listener as (event: Event) => void);
  }

  removeEventListener<T extends WorkflowEventType>(
    type: T,
    listener: WorkflowEventListener<T>
  ) {
    this.eventTarget.removeEventListener(
      type,
      listener as (event: Event) => void
    );
  }
}
