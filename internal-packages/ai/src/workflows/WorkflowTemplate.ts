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
  openRouterApiKey?: string;
  error?: string;
};

/**
 * This is a base class for workflow descriptions.
 *
 * It works similarly to LLMStepTemplate, but for workflows.
 */
export class WorkflowTemplate<const Shape extends IOShape> {
  readonly name: string;

  getInitialStep: (workflow: Workflow<Shape>) => PreparedStep<any>;
  getTransitionRule: (workflow: Workflow<Shape>) => StepTransitionRule<Shape>;

  // TODO - shape parameter
  constructor(params: {
    name: string;
    // This function will be called to obtain the first step of the workflow.
    getInitialStep: WorkflowTemplate<Shape>["getInitialStep"];
    // This function will be called to obtain the next step of the workflow based on the current step.
    getTransitionRule: WorkflowTemplate<Shape>["getTransitionRule"];
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
