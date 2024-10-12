import { BaseArtifact, makeArtifact } from "./Artifact.js";
import {
  calculatePriceMultipleCalls,
  LlmMetrics,
  Message,
} from "./LLMClient.js";
import {
  ErrorType,
  ExecuteContext,
  Inputs,
  IOShape,
  LLMStepTemplate,
  Outputs,
  StepState,
} from "./LLMStepTemplate.js";
import { LogEntry, Logger, TimestampedLogEntry } from "./Logger.js";
import { LlmId } from "./modelConfigs.js";
import { PromptPair } from "./prompts.js";
import {
  AiDeserializationVisitor,
  AiSerializationVisitor,
} from "./serialization.js";
import { getStepTemplateByName } from "./steps/registry.js";
import { Workflow } from "./workflows/Workflow.js";

export type StepParams<Shape extends IOShape> = {
  id: string;
  sequentialId: number;
  template: LLMStepTemplate<Shape>;
  state: StepState;
  inputs: Inputs<Shape>;
  outputs: Partial<Outputs<Shape>>;
  retryingStep?: LLMStepInstance<Shape>;
  startTime: number;
  conversationMessages: Message[];
  llmMetricsList: LlmMetrics[];
};

export class LLMStepInstance<
  const Shape extends IOShape = IOShape,
  const WorkflowShape extends IOShape = IOShape,
> {
  public id: StepParams<Shape>["id"];
  public sequentialId: StepParams<Shape>["sequentialId"];
  public readonly template: StepParams<Shape>["template"];

  private state: StepParams<Shape>["state"];
  private outputs: StepParams<Shape>["outputs"];
  public readonly inputs: StepParams<Shape>["inputs"];

  public retryingStep?: StepParams<Shape>["retryingStep"];

  private startTime: StepParams<Shape>["startTime"];
  private conversationMessages: StepParams<Shape>["conversationMessages"];
  public llmMetricsList: StepParams<Shape>["llmMetricsList"];

  // These two fields are not serialized
  private logger: Logger;
  private workflow: Workflow<WorkflowShape>;

  private constructor(
    params: StepParams<Shape> & {
      workflow: Workflow<WorkflowShape>;
    }
  ) {
    this.id = params.id;
    this.sequentialId = params.sequentialId;

    this.llmMetricsList = params.llmMetricsList;
    this.conversationMessages = params.conversationMessages;

    this.startTime = params.startTime;
    this.state = params.state;
    this.outputs = params.outputs;

    this.template = params.template;
    this.inputs = params.inputs;
    this.retryingStep = params.retryingStep;

    this.workflow = params.workflow;
    this.logger = new Logger();
  }

  // Create a new, PENDING step instance
  static create<Shape extends IOShape, WorkflowShape extends IOShape>(params: {
    template: LLMStepInstance<Shape>["template"];
    inputs: LLMStepInstance<Shape>["inputs"];
    retryingStep: LLMStepInstance<Shape>["retryingStep"];
    workflow: Workflow<WorkflowShape>;
  }): LLMStepInstance<Shape, WorkflowShape> {
    return new LLMStepInstance<Shape, WorkflowShape>({
      id: crypto.randomUUID(),
      sequentialId: params.workflow.getStepCount(),
      conversationMessages: [],
      llmMetricsList: [],
      startTime: Date.now(),
      state: { kind: "PENDING" },
      outputs: {},
      ...params,
    });
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logger.logs;
  }

  isRetrying(): boolean {
    return !!this.retryingStep;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  async _run() {
    if (this.state.kind !== "PENDING") {
      return;
    }

    const limits = this.workflow.checkResourceLimits();
    if (limits) {
      this.fail("CRITICAL", limits);
      return;
    }

    const executeContext: ExecuteContext<Shape> = {
      setOutput: (key, value) => this.setOutput(key, value),
      log: (log) => this.log(log),
      queryLLM: (promptPair) => this.queryLLM(promptPair),
      fail: (errorType, message) => this.fail(errorType, message),
    };

    try {
      await this.template.execute(executeContext, this.inputs);
    } catch (error) {
      this.fail(
        "MINOR",
        error instanceof Error ? error.message : String(error)
      );
      return;
    }

    const hasFailed = (this.state as StepState).kind === "FAILED";

    if (!hasFailed) {
      this.state = { kind: "DONE", durationMs: this.calculateDuration() };
    }
  }

  async run() {
    this.log({
      type: "info",
      message: `Step "${this.template.name}" started`,
    });

    await this._run();

    const completionMessage = `Step "${this.template.name}" completed with status: ${this.state.kind}${
      this.state.kind !== "PENDING" && `, in ${this.state.durationMs / 1000}s`
    }`;

    this.log({
      type: "info",
      message: completionMessage,
    });
  }

  getState() {
    return this.state;
  }

  getDuration() {
    return this.state.kind === "PENDING" ? 0 : this.state.durationMs;
  }

  getOutputs() {
    return this.outputs;
  }

  getInputs() {
    return this.inputs;
  }

  getTotalCost() {
    const totalCost = calculatePriceMultipleCalls(
      this.llmMetricsList.reduce(
        (acc, metrics) => {
          acc[metrics.llmId] = metrics;
          return acc;
        },
        {} as Record<LlmId, LlmMetrics>
      )
    );

    return totalCost;
  }

  isGenerationStep() {
    const stepHasCodeInput = Object.values(this.template.shape.inputs).some(
      (kind) => kind === "source" || kind === "code"
    );

    const stepHasCodeOutput = Object.values(this.template.shape.outputs).some(
      (kind) => kind === "source" || kind === "code"
    );

    return !stepHasCodeInput && stepHasCodeOutput;
  }

  isDone() {
    return this.state.kind === "DONE";
  }

  // private methods

  private setOutput<K extends Extract<keyof Shape["outputs"], string>>(
    key: K,
    value: Outputs<Shape>[K] | Outputs<Shape>[K]["value"]
  ): void {
    if (key in this.outputs) {
      this.fail(
        "CRITICAL",
        `Output ${key} is already set. This is a bug with the workflow code.`
      );
      return;
    }

    if (value instanceof BaseArtifact) {
      // already existing artifact - probably passed through from another step
      this.outputs[key] = value;
    } else {
      const kind = this.template.shape.outputs[
        key
      ] as Outputs<Shape>[K]["kind"];
      this.outputs[key] = makeArtifact(kind, value as any, this) as any;
    }
  }

  private log(log: LogEntry): void {
    this.logger.log(log, {
      workflowId: this.workflow.id,
      stepIndex: this.sequentialId,
    });
  }

  private fail(errorType: ErrorType, message: string) {
    this.log({ type: "error", message });
    this.state = {
      kind: "FAILED",
      durationMs: this.calculateDuration(),
      errorType,
      message,
    };
  }

  private calculateDuration() {
    return Date.now() - this.startTime;
  }

  private addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  private async queryLLM(promptPair: PromptPair): Promise<string | null> {
    try {
      const messagesToSend: Message[] = [
        ...this.workflow.getRelevantPreviousConversationMessages(
          this.workflow.llmConfig.messagesInHistoryToKeep
        ),
        {
          role: "user",
          content: promptPair.fullPrompt,
        },
      ];
      const completion = await this.workflow.llmClient.run(messagesToSend);

      this.log({
        type: "llmResponse",
        response: completion,
        content: completion.content,
        messages: messagesToSend,
        prompt: promptPair.fullPrompt,
      });

      this.llmMetricsList.push({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
        llmId: this.workflow.llmConfig.llmId,
      });

      if (!completion?.content) {
        this.log({
          type: "error",
          message: "Received an empty response from the API",
        });
        return null;
      } else {
        this.addConversationMessage({
          role: "user",
          content: promptPair.summarizedPrompt,
        });

        this.addConversationMessage({
          role: "assistant",
          content: completion?.content ?? "no response",
        });
      }

      return completion.content;
    } catch (error) {
      this.fail(
        "MINOR",
        `Error in queryLLM: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  // Serialization/deserialization

  // StepParams don't contain the workflow reference, to to avoid circular dependencies
  toParams(): StepParams<any> {
    return {
      id: this.id,
      sequentialId: this.sequentialId,
      template: this.template,
      state: this.state,
      inputs: this.inputs,
      outputs: this.outputs,
      retryingStep: this.retryingStep,
      startTime: this.startTime,
      conversationMessages: this.conversationMessages,
      llmMetricsList: this.llmMetricsList,
    };
  }

  static fromParams(
    params: StepParams<any>,
    workflow: Workflow<any>
  ): LLMStepInstance<any, any> {
    return new LLMStepInstance({ ...params, workflow });
  }

  static deserialize(
    { templateName, inputIds, outputIds, ...params }: SerializedStep,
    visitor: AiDeserializationVisitor
  ): StepParams<any> {
    const template: LLMStepTemplate<any> = getStepTemplateByName(templateName);
    const inputs = Object.fromEntries(
      Object.entries(inputIds).map(([name, inputId]) => [
        name,
        visitor.artifact(inputId),
      ])
    );
    const outputs = Object.fromEntries(
      Object.entries(outputIds).map(([name, outputId]) => [
        name,
        visitor.artifact(outputId),
      ])
    );

    return {
      ...params,
      template,
      inputs,
      outputs,
    };
  }
}

export function serializeStepParams(
  params: StepParams<IOShape>,
  visitor: AiSerializationVisitor
) {
  return {
    id: params.id,
    sequentialId: params.sequentialId,
    templateName: params.template.name,
    state: params.state,
    startTime: params.startTime,
    conversationMessages: params.conversationMessages,
    llmMetricsList: params.llmMetricsList,
    inputIds: Object.fromEntries(
      Object.entries(params.inputs).map(([key, input]) => [
        key,
        visitor.artifact(input),
      ])
    ),
    outputIds: Object.fromEntries(
      Object.entries(params.outputs)
        .map(([key, output]) =>
          output ? [key, visitor.artifact(output)] : undefined
        )
        .filter((x) => x !== undefined)
    ),
  };
}

export type SerializedStep = Omit<
  StepParams<IOShape>,
  // TODO - serialize retryingStep reference
  "inputs" | "outputs" | "template" | "retryingStep"
> & {
  templateName: string;
  inputIds: Record<string, number>;
  outputIds: Record<string, number>;
};
