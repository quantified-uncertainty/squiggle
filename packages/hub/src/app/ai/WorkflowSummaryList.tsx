import { orderBy } from "lodash";
import { FC } from "react";

import { SerializedWorkflow } from "@quri/squiggle-ai";

import { WorkflowSummaryItem } from "./WorkflowSummaryItem";

export const WorkflowSummaryList: FC<{
  workflows: SerializedWorkflow[];
  selectedWorkflow: SerializedWorkflow | undefined;
  selectWorkflow: (id: string) => void;
}> = ({ workflows, selectedWorkflow, selectWorkflow }) => {
  const sortedWorkflows = orderBy(workflows, ["timestamp"], ["asc"]);

  return (
    <div className="flex flex-col space-y-2">
      {sortedWorkflows.map((workflow) => (
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
