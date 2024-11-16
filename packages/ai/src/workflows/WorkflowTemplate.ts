import { LLMStepInstance } from "../LLMStepInstance.js";
import { Inputs, IOShape, PreparedStep } from "../LLMStepTemplate.js";
import { type LlmConfig, StepTransitionRule, Workflow } from "./Workflow.js";

export type WorkflowInstanceParams<Shape extends IOShape> = {
  id: string;
  template: WorkflowTemplate<Shape>;
  inputs: Inputs<Shape>;
  steps: LLMStepInstance<IOShape, Shape>[];
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
export class WorkflowTemplate<const Shape extends IOShape> {
  readonly name: string;

  getTransitionRule: (workflow: Workflow<Shape>) => StepTransitionRule<Shape>;
  getInitialStep: (workflow: Workflow<Shape>) => PreparedStep<any>;

  // TODO - shape parameter
  constructor(params: {
    name: string;
    // TODO - do we need two separate functions? we always call them together
    getTransitionRule: WorkflowTemplate<Shape>["getTransitionRule"];
    getInitialStep: WorkflowTemplate<Shape>["getInitialStep"];
  }) {
    this.name = params.name;
    this.getInitialStep = params.getInitialStep;
    this.getTransitionRule = params.getTransitionRule;
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
