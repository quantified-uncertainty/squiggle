import { useSearchParams } from "next/navigation";
import { FC, use } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";
import { Button, FireIcon } from "@quri/ui";

import { AdminContext } from "@/components/admin/AdminProvider";
import { LoadMoreViaSearchParam } from "@/components/LoadMoreViaSearchParam";
import { useUpdateSearchParams } from "@/lib/hooks/useUpdateSearchParams";

import { WorkflowSummaryItem } from "./WorkflowSummaryItem";

const WorkflowListAdminControls = () => {
  const { isAdminMode } = use(AdminContext);
  const updateSearchParams = useUpdateSearchParams();
  const searchParams = useSearchParams();

  if (!isAdminMode) {
    return null;
  }

  return searchParams.get("allUsers") ? (
    <Button
      size="small"
      onClick={() =>
        updateSearchParams((params) => {
          params.delete("allUsers");
          return params;
        })
      }
    >
      <FireIcon className="h-4 w-4 text-red-500" />
      Show my
    </Button>
  ) : (
    <Button
      size="small"
      onClick={() =>
        updateSearchParams((params) => {
          params.set("allUsers", "true");
          return params;
        })
      }
    >
      <FireIcon className="h-4 w-4 text-red-500" />
      Show all
    </Button>
  );
};

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
