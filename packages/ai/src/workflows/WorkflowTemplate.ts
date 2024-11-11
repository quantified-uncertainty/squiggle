import { LLMStepInstance } from "../LLMStepInstance.js";
import { Inputs, IOShape } from "../LLMStepTemplate.js";
import { type LlmConfig, Workflow } from "./Workflow.js";

export type WorkflowInstanceParams<Shape extends IOShape> = {
  id: string;
  template: WorkflowTemplate<Shape>;
  inputs: Inputs<Shape>;
  steps: LLMStepInstance<IOShape, Shape>[];
  abortSignal?: AbortSignal; // TODO
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  numericSteps?: number;
  styleGuideSteps?: number;
};

/**
 * This is a base class for workflow descriptions.
 *
 * It works similarly to LLMStepTemplate, but for workflows.
 */
export class WorkflowTemplate<const Shape extends IOShape> {
  public readonly name: string;

  public configureControllerLoop: (
    workflow: Workflow<Shape>,
    inputs: Inputs<Shape>
  ) => void;
  public configureInitialSteps: (
    workflow: Workflow<Shape>,
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
    params: Omit<WorkflowInstanceParams<Shape>, "id" | "template" | "steps">
  ): Workflow<Shape> {
    return new Workflow({
      ...params,
      id: crypto.randomUUID(),
      template: this,
      steps: [],
    });
  }
}
