import { WorkflowTemplate } from "./ControlledWorkflow.js";
import {
  createSquiggleWorkflowTemplate,
  fixSquiggleWorkflowTemplate,
} from "./SquiggleWorkflow.js";

export function getWorkflowTemplateByName(name: string) {
  const workflows: Record<string, WorkflowTemplate<any>> = {
    createSquiggle: createSquiggleWorkflowTemplate,
    fixSquiggle: fixSquiggleWorkflowTemplate,
  };

  if (!(name in workflows)) {
    throw new Error(`Workflow ${name} not found`);
  }
  return workflows[name];
}
