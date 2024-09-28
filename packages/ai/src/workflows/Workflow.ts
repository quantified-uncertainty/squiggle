import { generateSummary } from "../generateSummary.js";
import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  Message,
} from "../LLMClient.js";
import { LLMStepInstance } from "../LLMStepInstance.js";
import { Inputs, LLMStepTemplate, StepShape } from "../LLMStepTemplate.js";
import { TimestampedLogEntry } from "../Logger.js";
import { LlmId } from "../modelConfigs.js";
import {
  AiDeserializationVisitor,
  AiSerializationVisitor,
} from "../serialization.js";
import { ClientWorkflowResult } from "../types.js";

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
      type: "workflowStarted";
      payload?: undefined;
    }
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

const MAX_RETRIES = 5;
export class Workflow {
  private steps: LLMStepInstance[];

  public llmConfig: LlmConfig;
  public llmClient: LLMClient;
  public id: string;
  public startTime: number;

  private constructor(params: {
    id?: string;
    steps?: LLMStepInstance[];
    llmConfig?: LlmConfig;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) {
    this.llmConfig = params.llmConfig ?? llmConfigDefault;
    this.startTime = Date.now();
    this.id = params.id ?? crypto.randomUUID();
    this.steps = params.steps ?? [];

    this.llmClient = new LLMClient(
      this.llmConfig.llmId,
      params.openaiApiKey,
      params.anthropicApiKey
    );
  }

  static create(
    llmConfig: LlmConfig = llmConfigDefault,
    openaiApiKey?: string,
    anthropicApiKey?: string
  ) {
    return new Workflow({ llmConfig, openaiApiKey, anthropicApiKey });
  }

  // This is a hook that ControlledWorkflow can use to prepare the workflow.
  // It's a bit of a hack; we need to dispatch this event after we configured the event handlers,
  // but before we add any steps.
  // So we can't do this neither in the constructor nor in `runUntilComplete`.
  prepareToStart() {
    this.dispatchEvent({ type: "workflowStarted" });
  }

  addStep<S extends StepShape>(
    template: LLMStepTemplate<S>,
    inputs: Inputs<S>,
    options?: { retryingStep?: LLMStepInstance<S> }
  ): LLMStepInstance<S> {
    // sorry for "any"; countervariance issues
    const step: LLMStepInstance<any> = template.instantiate(
      this,
      inputs,
      options?.retryingStep
    );
    this.steps.push(step);
    this.dispatchEvent({
      type: "stepAdded",
      payload: { step },
    });
    return step;
  }

  addRetryOfPreviousStep() {
    const lastStep = this.steps.at(-1);
    if (!lastStep) return;

    const retryingStep = lastStep.retryingStep || lastStep;
    const retryAttempts = this.getCurrentRetryAttempts(retryingStep.id);

    if (retryAttempts >= MAX_RETRIES) {
      return;
    }

    this.addStep(retryingStep.template, retryingStep.inputs, { retryingStep });
  }

  public getCurrentRetryAttempts(stepId: string): number {
    return this.steps.filter((step) => step.retryingStep?.id === stepId).length;
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
    await step.run(this);

    this.dispatchEvent({
      type: "stepFinished",
      payload: { step },
    });
  }

  async runUntilComplete() {
    while (!this.isProcessComplete()) {
      await this.runNextStep();
    }

    this.dispatchEvent({ type: "allStepsFinished" });
  }

  checkResourceLimits(): string | undefined {
    if (
      Date.now() - this.startTime >
      this.llmConfig.durationLimitMinutes * 1000 * 60
    ) {
      return `Duration limit of ${this.llmConfig.durationLimitMinutes} minutes exceeded`;
    }

    if (this.priceSoFar() > this.llmConfig.priceLimit) {
      return `Price limit of $${this.llmConfig.priceLimit.toFixed(2)} exceeded`;
    }
    return undefined;
  }

  getSteps(): LLMStepInstance[] {
    return this.steps;
  }

  getStepCount(): number {
    return this.steps.length;
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

  getFinalResult(): ClientWorkflowResult {
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

    const logSummary = generateSummary(this);

    return {
      code,
      isValid,
      totalPrice,
      runTimeMs,
      llmRunCount,
      logSummary,
    };
  }

  llmMetricSummary(): Record<LlmId, LlmMetrics> {
    return this.getSteps().reduce(
      (acc, step) => {
        step.llmMetricsList.forEach((metrics) => {
          if (!acc[metrics.llmId]) {
            acc[metrics.llmId] = { ...metrics };
          } else {
            acc[metrics.llmId].apiCalls += metrics.apiCalls;
            acc[metrics.llmId].inputTokens += metrics.inputTokens;
            acc[metrics.llmId].outputTokens += metrics.outputTokens;
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

  private getMessagesFromSteps(steps: LLMStepInstance[]): Message[] {
    return steps.flatMap((step) => step.getConversationMessages());
  }

  private priceSoFar(): number {
    const currentMetrics = this.llmMetricSummary();
    return calculatePriceMultipleCalls(currentMetrics);
  }

  // We might want to add the generation step that failed.
  getRelevantPreviousConversationMessages(maxRecentSteps = 3): Message[] {
    const lastGenerateCodeIndex = this.steps.findLastIndex(
      (step) => step.isGenerationStep() && step.isDone()
    );

    if (lastGenerateCodeIndex === -1) {
      return [];
    }

    const remainingSteps = this.steps
      .slice(lastGenerateCodeIndex + 1)
      .filter((step) => step.isDone());

    // We always include the last generation step, and then at most `maxRecentSteps - 1` other steps.
    const remainingNSteps = [
      this.steps[lastGenerateCodeIndex],
      ...remainingSteps.slice(-(maxRecentSteps - 1)),
    ];

    return this.getMessagesFromSteps(remainingNSteps);
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

  // Serialization/deserialization
  serialize(visitor: AiSerializationVisitor): SerializedWorkflow {
    return {
      id: this.id,
      stepIds: this.steps.map(visitor.step),
    };
  }

  static deserialize({
    node,
    visitor,
    llmConfig,
    openaiApiKey,
    anthropicApiKey,
  }: {
    node: SerializedWorkflow;
    visitor: AiDeserializationVisitor;
    llmConfig: LlmConfig;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }): Workflow {
    return new Workflow({
      id: node.id,
      steps: node.stepIds.map(visitor.step),
      llmConfig,
      openaiApiKey,
      anthropicApiKey,
    });
  }
}

export type SerializedWorkflow = {
  id: string;
  stepIds: number[];
};
