import { SqError, SqProject } from "@quri/squiggle-lang";

import { LlmMetrics, Message } from "./LLMClient";
import { LogEntry, Logger, TimestampedLogEntry } from "./Logger";
import { PromptPair } from "./prompts";
import { Workflow } from "./Workflow";

export type CodeState =
  | {
      type: "formattingFailed";
      error: string;
      code: string;
    }
  | { type: "runFailed"; code: string; error: SqError; project: SqProject }
  | { type: "success"; code: string };

export function codeStateErrorString(codeState: CodeState): string {
  if (codeState.type === "formattingFailed") {
    return codeState.error;
  } else if (codeState.type === "runFailed") {
    return codeState.error.toStringWithDetails();
  }
  return "";
}

export type Artifact =
  | {
      kind: "prompt";
      value: string;
    }
  | {
      kind: "code";
      value: string;
    }
  | {
      kind: "codeState";
      value: CodeState;
    };

type ArtifactKind = Artifact["kind"];

export type StepShape<
  I extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
  O extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
> = {
  inputs: I;
  outputs: O;
};

type ExecuteContext<Shape extends StepShape> = {
  getInput<K extends keyof Shape["inputs"]>(key: K): Inputs<Shape>[K];
  setOutput<K extends keyof Shape["outputs"]>(
    key: K,
    value: Outputs<Shape>[K]
  ): void;
  queryLLM(promptPair: PromptPair): Promise<string | null>;
  log(log: LogEntry): void;
  workflow: Workflow; // TODO - shouldn't be exposed
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
    public readonly execute: (context: ExecuteContext<Shape>) => Promise<void>
  ) {}

  instantiate(
    workflow: Workflow,
    inputs: Inputs<Shape>
  ): LLMStepInstance<Shape> {
    return new LLMStepInstance(this, workflow, inputs);
  }
}

export class LLMStepInstance<const Shape extends StepShape = StepShape> {
  public durationMs?: number;
  private logger: Logger;
  private conversationMessages: Message[] = [];
  public llmMetricsList: LlmMetrics[] = [];
  private startTime: number;
  private state: "PENDING" | "DONE" | "FAILED" = "PENDING";
  private inputs: Inputs<Shape>;
  private outputs: Partial<Outputs<Shape>> = {};

  constructor(
    public readonly template: LLMStepTemplate<Shape>,
    public readonly workflow: Workflow,
    inputs: Inputs<Shape>
  ) {
    this.startTime = Date.now();
    this.logger = new Logger();
    this.inputs = inputs;
  }

  getInput<K extends keyof Inputs<Shape>>(key: K): Inputs<Shape>[K] {
    return this.inputs[key];
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logger.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  async run() {
    if (this.state !== "PENDING") {
      return;
    }

    const limits = this.workflow.checkResourceLimits();
    if (limits) {
      this.criticalError(limits);
      return;
    }

    const executeContext: ExecuteContext<Shape> = {
      getInput: (key) => this.getInput(key),
      setOutput: (key, value) => this.setOutput(key, value),
      log: (log) => this.log(log),
      queryLLM: (promptPair) => this.queryLLM(promptPair),
      workflow: this.workflow,
    };

    try {
      await this.template.execute(executeContext);
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

  getAllOutputs() {
    return this.outputs;
  }

  // private methods

  private setOutput<K extends keyof Outputs<Shape>>(
    key: K,
    value: Outputs<Shape>[K]
  ): void {
    // TODO - check if output is already set?
    this.outputs[key] = value;
  }

  private log(log: LogEntry): void {
    this.logger.log(log);
  }

  private criticalError(error: string) {
    this.log({ type: "error", message: error });
    this.updateDuration();
    this.state = "FAILED";
  }

  private updateDuration() {
    this.durationMs = Date.now() - this.startTime;
  }

  private complete() {
    this.updateDuration();
    this.state = "DONE";
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
        message: `Error in processLLMResponse: ${error instanceof Error ? error.message : error}`,
      });
      return null;
    }
  }
}
