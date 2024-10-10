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

interface Params<Shape extends IOShape> {
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
}

export class LLMStepInstance<const Shape extends IOShape = IOShape> {
  public id: Params<Shape>["id"];
  public sequentialId: number;
  public readonly template: Params<Shape>["template"];

  private state: Params<Shape>["state"];
  private outputs: Params<Shape>["outputs"];
  public readonly inputs: Params<Shape>["inputs"];

  public retryingStep?: Params<Shape>["retryingStep"];

  private startTime: Params<Shape>["startTime"];
  private logger: Logger;
  private conversationMessages: Params<Shape>["conversationMessages"];
  public llmMetricsList: Params<Shape>["llmMetricsList"];

  private constructor(params: Params<Shape>) {
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

    this.logger = new Logger();
  }

  // Create a new, PENDING step instance
  static create<Shape extends IOShape>(params: {
    template: LLMStepInstance<Shape>["template"];
    inputs: LLMStepInstance<Shape>["inputs"];
    retryingStep: LLMStepInstance<Shape>["retryingStep"];
    workflow: Workflow;
  }): LLMStepInstance<Shape> {
    return new LLMStepInstance<Shape>({
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

  async _run(workflow: Workflow) {
    if (this.state.kind !== "PENDING") {
      return;
    }

    const limits = workflow.checkResourceLimits();
    if (limits) {
      this.fail("CRITICAL", limits, workflow);
      return;
    }

    const executeContext: ExecuteContext<Shape> = {
      setOutput: (key, value) => this.setOutput(key, value, workflow),
      log: (log) => this.log(log, workflow),
      queryLLM: (promptPair) => this.queryLLM(promptPair, workflow),
      fail: (errorType, message) => this.fail(errorType, message, workflow),
    };

    try {
      await this.template.execute(executeContext, this.inputs);
    } catch (error) {
      this.fail(
        "MINOR",
        error instanceof Error ? error.message : String(error),
        workflow
      );
      return;
    }

    const hasFailed = (this.state as StepState).kind === "FAILED";

    if (!hasFailed) {
      this.state = { kind: "DONE", durationMs: this.calculateDuration() };
    }
  }

  async run(workflow: Workflow) {
    this.log(
      {
        type: "info",
        message: `Step "${this.template.name}" started`,
      },
      workflow
    );

    await this._run(workflow);

    const completionMessage = `Step "${this.template.name}" completed with status: ${this.state.kind}${
      this.state.kind !== "PENDING" && `, in ${this.state.durationMs / 1000}s`
    }`;

    this.log(
      {
        type: "info",
        message: completionMessage,
      },
      workflow
    );
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
    value: Outputs<Shape>[K] | Outputs<Shape>[K]["value"],
    workflow: Workflow
  ): void {
    if (key in this.outputs) {
      this.fail(
        "CRITICAL",
        `Output ${key} is already set. This is a bug with the workflow code.`,
        workflow
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

  private log(log: LogEntry, workflow: Workflow): void {
    this.logger.log(log, {
      workflowId: workflow.id,
      stepIndex: this.sequentialId,
    });
  }

  private fail(errorType: ErrorType, message: string, workflow: Workflow) {
    this.log({ type: "error", message }, workflow);
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

  private async queryLLM(
    promptPair: PromptPair,
    workflow: Workflow
  ): Promise<string | null> {
    try {
      const messagesToSend: Message[] = [
        ...workflow.getRelevantPreviousConversationMessages(
          workflow.llmConfig.messagesInHistoryToKeep
        ),
        {
          role: "user",
          content: promptPair.fullPrompt,
        },
      ];
      const completion = await workflow.llmClient.run(messagesToSend);

      this.log(
        {
          type: "llmResponse",
          response: completion,
          content: completion.content,
          messages: messagesToSend,
          prompt: promptPair.fullPrompt,
        },
        workflow
      );

      this.llmMetricsList.push({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
        llmId: workflow.llmConfig.llmId,
      });

      if (!completion?.content) {
        this.log(
          {
            type: "error",
            message: "Received an empty response from the API",
          },
          workflow
        );
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
        `Error in queryLLM: ${error instanceof Error ? error.message : error}`,
        workflow
      );
      return null;
    }
  }

  // Serialization/deserialization

  serialize(visitor: AiSerializationVisitor): SerializedStep {
    return {
      id: this.id,
      sequentialId: this.sequentialId,
      templateName: this.template.name,
      state: this.state,
      startTime: this.startTime,
      conversationMessages: this.conversationMessages,
      llmMetricsList: this.llmMetricsList,
      inputIds: Object.fromEntries(
        Object.entries(this.inputs).map(([key, input]) => [
          key,
          visitor.artifact(input),
        ])
      ),
      outputIds: Object.fromEntries(
        Object.entries(this.outputs).map(([key, output]) => [
          key,
          visitor.artifact(output),
        ])
      ),
    };
  }

  static deserialize(
    { templateName, inputIds, outputIds, ...params }: SerializedStep,
    visitor: AiDeserializationVisitor
  ): LLMStepInstance {
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

    return new LLMStepInstance({
      ...params,
      template,
      inputs,
      outputs,
    });
  }
}

export type SerializedStep = Omit<
  Params<IOShape>,
  // TODO - serialize retryingStep reference
  "inputs" | "outputs" | "template" | "retryingStep"
> & {
  templateName: string;
  inputIds: Record<string, number>;
  outputIds: Record<string, number>;
};
