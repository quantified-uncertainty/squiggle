import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { WorkflowSummaryItem } from "./WorkflowSummaryItem";

export const WorkflowSummaryList: FC<{
  workflows: ClientWorkflow[];
  selectedWorkflow: ClientWorkflow | undefined;
  selectWorkflow: (id: string) => void;
}> = ({ workflows, selectedWorkflow, selectWorkflow }) => {
  return (
    <div className="flex max-h-[400px] flex-col space-y-2 overflow-y-auto pr-2">
      {workflows.map((workflow) => (
        <WorkflowSummaryItem
          key={workflow.id}
          workflow={workflow}
          onSelect={() => selectWorkflow(workflow.id)}
          isSelected={workflow.id === selectedWorkflow?.id}
        />
      ))}
    </div>
  );
};
