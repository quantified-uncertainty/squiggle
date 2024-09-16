import { Artifact, ArtifactKind, BaseArtifact, makeArtifact } from "./Artifact";
import { calculatePriceMultipleCalls, LlmMetrics, Message } from "./LLMClient";
import { LogEntry, Logger, TimestampedLogEntry } from "./Logger";
import { LLMName } from "./modelConfigs";
import { PromptPair } from "./prompts";
import { Workflow } from "./Workflow";

export type StepState =
  | {
      kind: "PENDING";
    }
  | {
      kind: "DONE";
      durationMs: number;
    }
  | {
      kind: "FAILED";
      durationMs: number;
      error: string;
    };

export type StepShape<
  I extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
  O extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
> = {
  inputs: I;
  outputs: O;
};

type ExecuteContext<Shape extends StepShape> = {
  setOutput<K extends Extract<keyof Shape["outputs"], string>>(
    key: K,
    value: Outputs<Shape>[K] | Outputs<Shape>[K]["value"] // can be either the artifact or the value inside the artifact
  ): void;
  queryLLM(promptPair: PromptPair): Promise<string | null>;
  log(log: LogEntry): void;
  // workflow: Workflow; // intentionally not exposed, but if you need it, add it here
};

export type Inputs<Shape extends StepShape<any, any>> = {
  [K in keyof Shape["inputs"]]: Extract<Artifact, { kind: Shape["inputs"][K] }>;
};

type Outputs<Shape extends StepShape<any, any>> = {
  [K in keyof Shape["outputs"]]: Extract<
    Artifact,
    { kind: Shape["outputs"][K] }
  >;
};

export class LLMStepTemplate<const Shape extends StepShape = StepShape> {
  constructor(
    public readonly name: string,
    public readonly shape: Shape,
    public readonly execute: (
      context: ExecuteContext<Shape>,
      inputs: Inputs<Shape>
    ) => Promise<void>
  ) {}

  instantiate(
    workflow: Workflow,
    inputs: Inputs<Shape>
  ): LLMStepInstance<Shape> {
    return new LLMStepInstance(this, workflow, inputs);
  }
}

export class LLMStepInstance<const Shape extends StepShape = StepShape> {
  public id: string;
  private logger: Logger;
  private conversationMessages: Message[] = [];
  public llmMetricsList: LlmMetrics[] = [];
  private startTime: number;
  private state: StepState = { kind: "PENDING" };
  private outputs: Partial<Outputs<Shape>> = {};

  constructor(
    public readonly template: LLMStepTemplate<Shape>,
    public readonly workflow: Workflow,
    private readonly inputs: Inputs<Shape>
  ) {
    this.startTime = Date.now();
    this.id = crypto.randomUUID();
    this.logger = new Logger();
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logger.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  async run() {
    if (this.state.kind !== "PENDING") {
      return;
    }

    const limits = this.workflow.checkResourceLimits();
    if (limits) {
      this.criticalError(limits);
      return;
    }

    const executeContext: ExecuteContext<Shape> = {
      setOutput: (key, value) => this.setOutput(key, value),
      log: (log) => this.log(log),
      queryLLM: (promptPair) => this.queryLLM(promptPair),
    };

    try {
      await this.template.execute(executeContext, this.inputs);
    } catch (error) {
      this.criticalError(
        error instanceof Error ? error.message : String(error)
      );
      return;
    }
    this.complete();
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
          acc[metrics.llmName] = metrics;
          return acc;
        },
        {} as Record<LLMName, LlmMetrics>
      )
    );

    return totalCost;
  }

  // private methods

  private setOutput<K extends Extract<keyof Shape["outputs"], string>>(
    key: K,
    value: Outputs<Shape>[K] | Outputs<Shape>[K]["value"]
  ): void {
    if (key in this.outputs) {
      this.criticalError(`Output ${key} is already set`);
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
    this.logger.log(log);
  }

  private criticalError(error: string) {
    this.log({ type: "error", message: error });
    this.state = {
      kind: "FAILED",
      durationMs: this.calculateDuration(),
      error,
    };
  }

  private calculateDuration() {
    return Date.now() - this.startTime;
  }

  private complete() {
    this.state = { kind: "DONE", durationMs: this.calculateDuration() };
  }

  private addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  private async queryLLM(promptPair: PromptPair): Promise<string | null> {
    try {
      const workflow = this.workflow;
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
        llmName: workflow.llmConfig.llmName,
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
      this.log({
        type: "error",
        message: `Error in queryLLM: ${error instanceof Error ? error.message : error}`,
      });
      return null;
    }
  }
}
