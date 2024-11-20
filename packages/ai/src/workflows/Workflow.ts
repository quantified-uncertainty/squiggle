import { ReadableStream } from "stream/web";

import { generateSummary } from "../generateSummary.js";
import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  Message,
} from "../LLMClient.js";
import { LLMStepInstance } from "../LLMStepInstance.js";
import { Inputs, IOShape, PreparedStep } from "../LLMStepTemplate.js";
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

export type StepTransitionRule<Shape extends IOShape> = (
  step: LLMStepInstance<IOShape, Shape>,
  helpers: WorkflowGuardHelpers<Shape>
) => NextStepAction;

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

  public llmConfig: LlmConfig;
  // This field is somewhat broken - it's set to `Date.now()`, even when the workflow was deserialized from the database.
  // It's better to use `steps[0].startTime` as the start time, if you're sure that the workflow has already started and so it has at least one step.
  public startTime: number;

  private steps: LLMStepInstance<IOShape, Shape>[];
  private transitionRule: StepTransitionRule<Shape>;

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

    this.transitionRule = params.template.getTransitionRule(this);
  }

  private startOrThrow() {
    // This function just inserts the first step.
    // Previously we had a `started` flag, but that wasn't very useful.
    // But if we ever implement resumable workflows, we'll need to change this.
    if (this.steps.length) {
      throw new Error("Workflow already started");
    }

    this.dispatchEvent({ type: "workflowStarted" });

    // add the first step
    const initialStep = this.template.getInitialStep(this);
    this.addStep(initialStep);
  }

  // Run workflow to the ReadableStream, appropriate for streaming in Next.js routes
  runAsStream(): ReadableStream<string> {
    const stream = new ReadableStream<string>({
      start: async (controller) => {
        addStreamingListeners(this, controller);

        this.startOrThrow();

        await this.runUntilComplete();
      },
    });

    return stream;
  }

  // Run workflow without streaming, only capture the final result
  async runToResult(): Promise<ClientWorkflowResult> {
    this.startOrThrow();

    await this.runUntilComplete();

    return this.getFinalResult();
  }

  private addStep<S extends IOShape>(
    prepatedStep: PreparedStep<S>
  ): LLMStepInstance<S, Shape> {
    // `any` is necessary because of countervariance issues.
    // But that's not important because `PreparedStep` was already strictly typed.
    const step: LLMStepInstance<any, Shape> = LLMStepInstance.create({
      template: prepatedStep.template,
      inputs: prepatedStep.inputs,
      workflow: this,
    });

    this.steps.push(step);
    this.dispatchEvent({
      type: "stepAdded",
      payload: { step },
    });
    return step;
  }

  private async runNextStep(): Promise<void> {
    const step = this.getCurrentStep();

    if (!step || step.getState().kind !== "PENDING") {
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

    // apply the transition rule, produce the next step in PENDING state
    // this code is inlined in this method, which guarantees that we always have one pending step
    // (until the transition rule decides to finish)
    const result = this.transitionRule(step, new WorkflowGuardHelpers(step));
    switch (result.kind) {
      case "repeat":
        this.addStep(step.template.prepare(step.inputs));
        break;
      case "step":
        this.addStep(result.step.prepare(result.inputs));
        break;
      case "finish":
        // no new steps to add
        break;
      case "fatal":
        throw new Error(result.message);
    }
  }

  async runUntilComplete() {
    if (!this.steps.length) {
      throw new Error("Workflow not started");
    }

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
      const stepState = step.getState();
      if (stepState.kind !== "DONE") {
        continue;
      }

      for (const output of Object.values(stepState.outputs)) {
        if (output?.kind === "code") {
          // If we find successful code, return immediately
          if (output.value.type === "success") {
            return { step, code: output.value.source };
          }
          // Store the first step with any code
          stepWithAnyCode ??= { step, code: output.value.source };
        }
      }
    }

    return stepWithAnyCode;
  }

  getFinalResult(): ClientWorkflowResult {
    const finalStep = this.getRecentStepWithCode();
    const isValid = finalStep?.step.getState().kind === "DONE";

    // compute run time
    let runTimeMs: number;
    const lastStep = this.steps.at(-1);
    if (!lastStep) {
      throw new Error("No steps found");
    }

    {
      const lastStepState = lastStep.getState();
      if (lastStepState.kind === "PENDING") {
        throw new Error("Last step is still pending");
      }

      const startTime = this.steps[0].startTime;
      const endTime = lastStep.startTime + lastStepState.durationMs;
      runTimeMs = endTime - startTime;
    }

    const { totalPrice, llmRunCount } = this.getLlmMetrics();

    const logSummary = generateSummary(this);

    return {
      code: finalStep?.code ?? "",
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
