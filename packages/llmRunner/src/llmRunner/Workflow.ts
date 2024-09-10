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

export type WorkflowEventShape =
  | {
      type: "addStep";
      payload: {
        step: LLMStepInstance;
      };
    }
  | {
      type: "startStep";
      payload: {
        step: LLMStepInstance;
      };
    }
  | {
      type: "finishStep";
      payload: {
        step: LLMStepInstance;
      };
    };

export type WorkflowEventType = WorkflowEventShape["type"];

export class WorkflowEvent<T extends WorkflowEventType> extends Event {
  constructor(
    type: T,
    public data: Extract<WorkflowEventShape, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type WorkflowEventListener<T extends WorkflowEventType> = (
  event: WorkflowEvent<T>
) => void;

type WorkflowResult = {
  isValid: boolean;
  code: string;
  logs: TimestampedLogEntry[];
};

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
    // sorry for "any"; countervariance issues
    const step: LLMStepInstance<any> = template.instantiate(this, inputs);
    this.steps.push(step);
    this.dispatchEvent({
      type: "addStep",
      payload: { step },
    });
    return step;
  }

  async runNextStep(): Promise<{
    continueExecution: boolean;
  }> {
    const step = this.getCurrentStep();

    if (!step) {
      return { continueExecution: false };
    }

    this.dispatchEvent({
      type: "startStep",
      payload: { step },
    });
    await step.run();

    console.log(chalk.cyan(`Finishing state ${step.template.name}`));
    this.dispatchEvent({
      type: "finishStep",
      payload: { step },
    });

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
      const outputs = step.getAllOutputs();
      for (const output of Object.values(outputs)) {
        if (output?.kind === "code") {
          code = output.value;
        } else if (output?.kind === "codeState") {
          code = output.value.code;
        }
      }
      if (code) break;
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

  // Event methods

  private eventTarget = new EventTarget();

  private dispatchEvent(shape: WorkflowEventShape) {
    this.eventTarget.dispatchEvent(
      new WorkflowEvent(shape.type, shape.payload)
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
