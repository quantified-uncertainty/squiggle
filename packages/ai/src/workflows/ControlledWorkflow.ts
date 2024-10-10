import { ReadableStream } from "stream/web";

import { Inputs, IOShape } from "../LLMStepTemplate.js";
import {
  AiDeserializationVisitor,
  AiSerializationVisitor,
} from "../serialization.js";
import { ClientWorkflowResult } from "../types.js";
import { getWorkflowTemplateByName } from "./registry.js";
import { addStreamingListeners } from "./streaming.js";
import { LlmConfig, Workflow } from "./Workflow.js";

type WorkflowInstanceParams<Shape extends IOShape> = {
  template: WorkflowTemplate<Shape>;
  inputs: Inputs<Shape>;
  abortSignal?: AbortSignal; // TODO
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
};

/**
 * This is a base class for workflow descriptions.
 *
 * It works similarly to LLMStepTemplate, but for workflows.
 */
export class WorkflowTemplate<Shape extends IOShape> {
  public readonly name: string;

  public configureControllerLoop: (
    workflow: Workflow,
    inputs: Inputs<Shape>
  ) => void;
  public configureInitialSteps: (
    workflow: Workflow,
    inputs: Inputs<Shape>
  ) => void;

  // TODO - shape parameter
  constructor(params: {
    name: string;
    // TODO - do we need two separate functions? we always call them together
    configureControllerLoop: WorkflowTemplate<Shape>["configureControllerLoop"];
    configureInitialSteps: WorkflowTemplate<Shape>["configureInitialSteps"];
  }) {
    this.name = params.name;
    this.configureInitialSteps = params.configureInitialSteps;
    this.configureControllerLoop = params.configureControllerLoop;
  }

  instantiate(
    params: Omit<WorkflowInstanceParams<Shape>, "template">
  ): WorkflowInstance<Shape> {
    return new WorkflowInstance({ ...params, template: this });
  }
}

export class WorkflowInstance<Shape extends IOShape> {
  public workflow: Workflow;
  public readonly template: WorkflowTemplate<Shape>;
  public readonly inputs: Inputs<Shape>;
  private started: boolean = false;

  constructor(params: WorkflowInstanceParams<Shape>) {
    this.workflow = Workflow.create(
      params.llmConfig,
      params.openaiApiKey,
      params.anthropicApiKey
    );
    this.template = params.template;
    this.inputs = params.inputs;
  }

  private startOrThrow() {
    if (this.started) {
      throw new Error("Workflow already started");
    }
    this.started = true;
  }

  private configure() {
    // we configure the controller loop first, so it has a chance to react to its initial step
    this.template.configureControllerLoop(this.workflow, this.inputs);
    this.template.configureInitialSteps(this.workflow, this.inputs);
  }

  // Run workflow to the ReadableStream, appropriate for streaming in Next.js routes
  runAsStream(): ReadableStream<string> {
    this.startOrThrow();

    const stream = new ReadableStream<string>({
      start: async (controller) => {
        addStreamingListeners(this.workflow, controller);

        this.workflow.prepareToStart();

        // Important! `configure` should be called after all event listeners are set up.
        // We want to capture `stepAdded` events.
        this.configure();

        await this.workflow.runUntilComplete();
        controller.close();
      },
    });

    return stream;
  }

  // Run workflow without streaming, only capture the final result
  async runToResult(): Promise<ClientWorkflowResult> {
    this.startOrThrow();
    this.configure();

    await this.workflow.runUntilComplete();

    // saveSummaryToFile(generateSummary(workflow));
    return this.workflow.getFinalResult();
  }

  serialize(visitor: AiSerializationVisitor): SerializedWorkflowInstance {
    return {
      inputIds: Object.fromEntries(
        Object.entries(this.inputs).map(([key, input]) => [
          key,
          visitor.artifact(input),
        ])
      ),
      workflowId: visitor.workflow(this.workflow),
      templateName: this.template.name,
    };
  }

  static deserialize(params: {
    node: SerializedWorkflowInstance;
    visitor: AiDeserializationVisitor;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) {
    return new WorkflowInstance({
      inputs: Object.fromEntries(
        Object.entries(params.node.inputIds).map(([key, id]) => [
          key,
          params.visitor.artifact(id),
        ])
      ),
      template: getWorkflowTemplateByName(params.node.templateName),
      openaiApiKey: params.openaiApiKey,
      anthropicApiKey: params.anthropicApiKey,
    });
  }
}

export type SerializedWorkflowInstance = {
  inputIds: Record<string, number>;
  workflowId: number;
  templateName: string;
};
