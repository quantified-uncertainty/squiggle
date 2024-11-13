import { ReadableStream } from "stream/web";

import { generateSummary } from "../generateSummary.js";
import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  Message,
} from "../LLMClient.js";
import { LLMStepInstance } from "../LLMStepInstance.js";
import { Inputs, IOShape, LLMStepTemplate } from "../LLMStepTemplate.js";
import { TimestampedLogEntry } from "../Logger.js";
import { LlmId } from "../modelConfigs.js";
import {
  AiDeserializationVisitor,
  AiSerializationVisitor,
} from "../serialization.js";
import { ClientWorkflow, ClientWorkflowResult } from "../types.js";
import {
  addStreamingListeners,
  artifactToClientArtifact,
  stepToClientStep,
} from "./streaming.js";
import {
  NextStepAction,
  WorkflowGuardHelpers,
} from "./WorkflowGuardHelpers.js";
import {
  type WorkflowInstanceParams,
  type WorkflowTemplate,
} from "./WorkflowTemplate.js";

export type LlmConfig = {
  llmId: LlmId;
  priceLimit: number;
  durationLimitMinutes: number;
  messagesInHistoryToKeep: number;
  numericSteps: number;
  styleGuideSteps: number;
};

export const llmConfigDefault: LlmConfig = {
  llmId: "Claude-Sonnet",
  priceLimit: 0.3,
  durationLimitMinutes: 1,
  messagesInHistoryToKeep: 4,
  numericSteps: 3,
  styleGuideSteps: 2,
};

export type WorkflowEventShape<WorkflowShape extends IOShape> =
  | {
      type: "workflowStarted";
      payload?: undefined;
    }
  | {
      type: "stepAdded";
      payload: {
        step: LLMStepInstance<IOShape, WorkflowShape>;
      };
    }
  | {
      type: "stepStarted";
      payload: {
        step: LLMStepInstance<IOShape, WorkflowShape>;
      };
    }
  | {
      type: "stepFinished";
      payload: {
        step: LLMStepInstance<IOShape, WorkflowShape>;
      };
    }
  | {
      type: "allStepsFinished";
      payload?: undefined;
    };

export type WorkflowEventType = WorkflowEventShape<any>["type"];

export class WorkflowEvent<
  T extends WorkflowEventType,
  Shape extends IOShape,
> extends Event {
  constructor(
    type: T,
    public workflow: Workflow<Shape>,
    public data: Extract<WorkflowEventShape<Shape>, { type: T }>["payload"]
  ) {
    super(type);
  }
}

export type WorkflowEventListener<
  T extends WorkflowEventType,
  Shape extends IOShape,
> = (event: WorkflowEvent<T, Shape>) => void;

/**
 * This class is responsible for managing the steps in a workflow.
 *
 * It does not make any assumptions about the steps themselves, it just
 * provides a way to add them and interact with them.
 */

export class Workflow<Shape extends IOShape = IOShape> {
  public id: string;
  public readonly template: WorkflowTemplate<Shape>;
  public readonly inputs: Inputs<Shape>;
  private started: boolean = false;

  public llmConfig: LlmConfig;
  public startTime: number;

  private steps: LLMStepInstance<IOShape, Shape>[];

  public llmClient: LLMClient;

  constructor(params: WorkflowInstanceParams<Shape>) {
    this.id = params.id ?? crypto.randomUUID();
    this.template = params.template;
    this.inputs = params.inputs;

    this.llmConfig = params.llmConfig ?? llmConfigDefault;
    this.startTime = Date.now();
    this.steps = params.steps ?? [];

    this.llmClient = new LLMClient(
      this.llmConfig.llmId,
      params.openaiApiKey,
      params.anthropicApiKey
    );
  }

  private startOrThrow() {
    if (this.started) {
      throw new Error("Workflow already started");
    }
    this.started = true;
  }

  private configure() {
    // we configure the controller loop first, so it has a chance to react to its initial step
    this.template.configureControllerLoop(this, this.inputs);
    this.template.configureInitialSteps(this, this.inputs);
  }

  // Run workflow to the ReadableStream, appropriate for streaming in Next.js routes
  runAsStream(): ReadableStream<string> {
    this.startOrThrow();

    const stream = new ReadableStream<string>({
      start: async (controller) => {
        addStreamingListeners(this, controller);

        // We need to dispatch this event after we configured the event
        // handlers, but before we add any steps.
        this.dispatchEvent({ type: "workflowStarted" });

        // Important! `configure` should be called after all event listeners are
        // set up. We want to capture `stepAdded` events.
        this.configure();

        await this.runUntilComplete();
        controller.close();
      },
    });

    return stream;
  }

  // Run workflow without streaming, only capture the final result
  async runToResult(): Promise<ClientWorkflowResult> {
    this.startOrThrow();
    this.configure();

    await this.runUntilComplete();

    // saveSummaryToFile(generateSummary(workflow));
    return this.getFinalResult();
  }

  getPreviousStep(
    step: LLMStepInstance<any, Shape>
  ): LLMStepInstance<any, Shape> | undefined {
    const index = this.steps.indexOf(step);
    if (index < 1) {
      return undefined;
    }
    return this.steps[index - 1];
  }

  addStep<S extends IOShape>(
    template: LLMStepTemplate<S>,
    inputs: Inputs<S>
  ): LLMStepInstance<S, Shape> {
    // sorry for "any"; contravariance issues
    const step: LLMStepInstance<any, Shape> = LLMStepInstance.create({
      template,
      inputs,
      workflow: this,
    });

    this.steps.push(step);
    this.dispatchEvent({
      type: "stepAdded",
      payload: { step },
    });
    return step;
  }

  addLinearRule(
    produce: (
      step: LLMStepInstance<IOShape, Shape>,
      helpers: WorkflowGuardHelpers<Shape>
    ) => NextStepAction
  ) {
    this.addEventListener("stepFinished", ({ data: { step } }) => {
      const result = produce(step, new WorkflowGuardHelpers(this, step));
      switch (result.kind) {
        case "repeat":
          this.addStep(step.template, step.inputs);
          break;
        case "step":
          this.addStep(result.step, result.inputs);
          break;
        case "finish":
          // no new steps to add
          break;
        case "fatal":
          throw new Error(result.message);
      }
    });
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

  getSteps(): LLMStepInstance<IOShape, Shape>[] {
    return this.steps;
  }

  getStepCount(): number {
    return this.steps.length;
  }

  private getCurrentStep(): LLMStepInstance<IOShape, Shape> | undefined {
    return this.steps.at(-1);
  }

  getLogs(): TimestampedLogEntry[] {
    return this.steps.flatMap((r) => r.getLogs());
  }

  private isProcessComplete(): boolean {
    return this.getCurrentStep()?.getState().kind !== "PENDING";
  }

  // Returns the most recent step with successful code, or just the most recent step with any code if no successful code is found
  getRecentStepWithCode():
    | { step: LLMStepInstance<IOShape, Shape>; code: string }
    | undefined {
    let stepWithAnyCode:
      | { step: LLMStepInstance<IOShape, Shape>; code: string }
      | undefined;

    // Single pass through steps from most recent to oldest
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      const outputs = step.getOutputs();

      for (const output of Object.values(outputs)) {
        if (output?.kind === "code") {
          // If we find successful code, return immediately
          if (output.value.type === "success") {
            return { step, code: output.value.source };
          }
          // Otherwise store the first step with any code
          if (!stepWithAnyCode) {
            stepWithAnyCode = { step, code: output.value.source };
          }
        }
      }
    }

    return stepWithAnyCode;
  }

  getFinalResult(): ClientWorkflowResult {
    const finalStep = this.getRecentStepWithCode();
    if (!finalStep) {
      throw new Error("No steps found");
    }

    const isValid = finalStep.step.getState().kind === "DONE";

    const endTime = Date.now();
    const runTimeMs = endTime - this.startTime;
    const { totalPrice, llmRunCount } = this.getLlmMetrics();

    const logSummary = generateSummary(this);

    return {
      code: finalStep.code,
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

  private getMessagesFromSteps(
    steps: LLMStepInstance<IOShape, Shape>[]
  ): Message[] {
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

  private dispatchEvent(shape: WorkflowEventShape<Shape>) {
    this.eventTarget.dispatchEvent(
      new WorkflowEvent(shape.type, this, shape.payload)
    );
  }

  addEventListener<T extends WorkflowEventType>(
    type: T,
    listener: WorkflowEventListener<T, Shape>
  ) {
    this.eventTarget.addEventListener(type, listener as (event: Event) => void);
  }

  removeEventListener<T extends WorkflowEventType>(
    type: T,
    listener: WorkflowEventListener<T, Shape>
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
      templateName: this.template.name,
      inputIds: Object.fromEntries(
        Object.entries(this.inputs).map(([key, input]) => [
          key,
          visitor.artifact(input),
        ])
      ),
      stepIds: this.steps.map((step) => visitor.step(step.toParams())),
      llmConfig: this.llmConfig,
    };
  }

  static deserialize({
    node,
    visitor,
    openaiApiKey,
    anthropicApiKey,
    getWorkflowTemplateByName,
  }: {
    node: SerializedWorkflow;
    visitor: AiDeserializationVisitor;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    // can't be imported from workflow registry because of circular dependency
    getWorkflowTemplateByName: (name: string) => WorkflowTemplate<any>;
  }): Workflow<IOShape> {
    const workflow = new Workflow({
      id: node.id,
      template: getWorkflowTemplateByName(node.templateName),
      inputs: Object.fromEntries(
        Object.entries(node.inputIds).map(([key, id]) => [
          key,
          visitor.artifact(id),
        ])
      ),
      llmConfig: node.llmConfig,
      steps: [],
      openaiApiKey,
      anthropicApiKey,
    });

    // restore steps and create back references from steps to workflow
    workflow.steps = node.stepIds
      .map(visitor.step)
      .map((params) => LLMStepInstance.fromParams(params, workflow));

    return workflow;
  }

  // Client-side representation
  asClientWorkflow(): ClientWorkflow {
    return {
      id: this.id,
      timestamp: this.startTime,
      steps: this.steps.map((step) =>
        stepToClientStep(step as LLMStepInstance)
      ),
      currentStep: this.getCurrentStep()?.id,
      ...(this.isProcessComplete()
        ? {
            status: "finished",
            result: this.getFinalResult(),
          }
        : { status: "loading" }),
      inputs: Object.fromEntries(
        Object.entries(this.inputs).map(([key, value]) => [
          key,
          artifactToClientArtifact(value),
        ])
      ),
    };
  }
}

export type SerializedWorkflow = {
  id: string;
  templateName: string;
  inputIds: Record<string, number>;
  llmConfig: LlmConfig;
  stepIds: number[];
};
