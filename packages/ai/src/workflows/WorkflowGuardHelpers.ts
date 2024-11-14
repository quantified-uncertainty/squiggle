import { LLMStepInstance } from "../LLMStepInstance.js";
import { Inputs, IOShape, LLMStepTemplate } from "../LLMStepTemplate.js";
import { Workflow } from "./Workflow.js";

export type NextStepAction =
  | {
      kind: "repeat";
    }
  | {
      kind: "step";
      step: LLMStepTemplate<any>;
      inputs: Inputs<any>;
    }
  | {
      kind: "finish";
    }
  | {
      // internal logic error
      kind: "fatal";
      message: string;
    };

/*
Btw I plan to implement the repeat limits ("no more than 4 times", etc) that you mention in your PR description with something similarly declarative.
I'm thinking of another guard parameter to addRule, let's say workflowGuard: (helpers) => ... , where helpers would be an object with common methods.
Example:
addRule({
  workflowGuard: (helpers) => helpers.totalRepeats(fixCodeUntilItRunsStep) < 10 && helpers.recentRepeats(fixCodeUntilItRunsStep) < 3,
  ...
})
Where totalRepeats counts the number of template runs in the entire history, while receptRepeats counts the number of immediate repeats in the step -> parent -> parent chain. (I'm stubborn and still trying to make it parallelism-agnostic, so thinking in terms of graphs, not lists). 
*/
export class WorkflowGuardHelpers<Shape extends IOShape> {
  constructor(
    private readonly workflow: Workflow<Shape>,
    private readonly _step: LLMStepInstance<any, Shape>
  ) {}

  totalRepeats(template: LLMStepTemplate<any>) {
    return this.workflow.getSteps().filter((step) => step.instanceOf(template))
      .length;
  }

  recentRepeats(template: LLMStepTemplate<any>) {
    let count = -1;
    let step = this.workflow.getPreviousStep(this._step);
    while (step?.instanceOf(template)) {
      count++;
      step = this.workflow.getPreviousStep(step);
    }
    return count;
  }

  recentFailedRepeats(template: LLMStepTemplate<any>) {
    let count = -1;
    let step = this.workflow.getPreviousStep(this._step);
    while (step?.instanceOf(template) && step.getState().kind === "FAILED") {
      count++;
      step = this.workflow.getPreviousStep(step);
    }
    return count;
  }

  // repeat the step with the same inputs
  repeat(): NextStepAction {
    return { kind: "repeat" };
  }

  fatal(message: string): NextStepAction {
    return { kind: "fatal", message };
  }

  finish(): NextStepAction {
    return { kind: "finish" };
  }

  step<StepShape extends IOShape>(
    template: LLMStepTemplate<StepShape>,
    inputs: Inputs<StepShape>
  ): NextStepAction {
    return { kind: "step", step: template, inputs };
  }
}
