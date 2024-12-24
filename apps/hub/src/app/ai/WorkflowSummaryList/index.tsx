import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { LoadMoreViaSearchParam } from "@/components/LoadMoreViaSearchParam";

import { WorkflowListAdminControls } from "./WorkflowListAdminControls";
import { WorkflowSummaryItem } from "./WorkflowSummaryItem";

export const WorkflowSummaryList: FC<{
  workflows: ClientWorkflow[];
  selectedWorkflow: ClientWorkflow | undefined;
  selectWorkflow: (id: string) => void;
  hasMoreWorkflows: boolean;
}> = ({ workflows, selectedWorkflow, selectWorkflow, hasMoreWorkflows }) => {
  return (
    <div className="flex-grow overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="mb-2 text-sm font-bold">Workflows</h2>
        <WorkflowListAdminControls />
      </div>
      <div className="flex max-h-[400px] w-full flex-col overflow-y-auto rounded-md border border-slate-200">
        {workflows.map((workflow, index) => (
          <WorkflowSummaryItem
            key={workflow.id}
            workflow={workflow}
            onSelect={() => selectWorkflow(workflow.id)}
            isSelected={workflow.id === selectedWorkflow?.id}
            isLast={index === workflows.length - 1}
          />
        ))}
      </div>
      {hasMoreWorkflows && <LoadMoreViaSearchParam />}
    </div>
  );
};
