import { WorkflowTemplate } from "./ControlledWorkflow.js";
import {
  createSquiggleWorkflowTemplate,
  fixSquiggleWorkflowTemplate,
} from "./SquiggleWorkflow.js";

export function getWorkflowTemplateByName(name: string) {
  const workflows: Record<string, WorkflowTemplate<any>> = Object.fromEntries(
    [createSquiggleWorkflowTemplate, fixSquiggleWorkflowTemplate].map(
      (workflow) => [workflow.name, workflow]
    )
  );

  if (!(name in workflows)) {
    throw new Error(`Workflow ${name} not found`);
  }
  return workflows[name];
}
