import { FC } from "react";

import { AiWorkflow } from "@/ai/data/loadWorkflows";
import { LoadMore } from "@/components/LoadMore";

import { WorkflowListAdminControls } from "./WorkflowListAdminControls";
import { WorkflowSummaryItem } from "./WorkflowSummaryItem";

export const WorkflowSummaryList: FC<{
  workflows: AiWorkflow[];
  selectedWorkflow: AiWorkflow | undefined;
  selectWorkflow: (id: string) => void;
  loadNext?: (count: number) => void;
}> = ({ workflows, selectedWorkflow, selectWorkflow, loadNext }) => {
  return (
    <div className="flex-grow overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="mb-2 text-sm font-bold">Workflows</h2>
        <WorkflowListAdminControls />
      </div>
      <div className="flex max-h-[400px] w-full flex-col overflow-y-auto rounded-md border border-slate-200">
        {workflows.map((workflow, index) => (
          <WorkflowSummaryItem
            key={workflow.workflow.id}
            workflow={workflow}
            onSelect={() => selectWorkflow(workflow.workflow.id)}
            isSelected={workflow.workflow.id === selectedWorkflow?.workflow.id}
            isLast={index === workflows.length - 1}
          />
        ))}
      </div>
      {loadNext && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
