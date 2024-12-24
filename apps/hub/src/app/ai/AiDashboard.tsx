"use client";

import { FC, useRef } from "react";

import { AiWorkflow } from "@/ai/data/loadWorkflows";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { Paginated } from "@/lib/types";

import { Sidebar } from "./Sidebar";
import { useSquiggleWorkflows } from "./useSquiggleWorkflows";
import { WorkflowViewer } from "./WorkflowViewer";

type Props = {
  initialWorkflows: Paginated<AiWorkflow>;
};

export const AiDashboard: FC<Props> = ({ initialWorkflows }: Props) => {
  const { items: unpaginatedWorkflows, loadNext } =
    usePaginator(initialWorkflows);

  const { workflows, submitWorkflow, selectedWorkflow, selectWorkflow } =
    useSquiggleWorkflows(unpaginatedWorkflows);

  const sidebarRef = useRef<{ edit: (code: string) => void }>(null);

  return (
    <div className="flex">
      {/* Left column: Mode Toggle, Chat, Form, and list of Workflows */}
      <div className="w-1/5 p-2">
        <Sidebar
          submitWorkflow={submitWorkflow}
          selectWorkflow={selectWorkflow}
          selectedWorkflow={selectedWorkflow}
          workflows={workflows}
          loadNext={loadNext}
          ref={sidebarRef}
        />
      </div>
      {/* Right column: Menu and SquigglePlayground */}
      {selectedWorkflow && (
        <div className="min-w-0 flex-1 overflow-x-auto">
          <WorkflowViewer
            key={selectedWorkflow.workflow.id}
            workflow={selectedWorkflow.workflow}
          />
        </div>
      )}
    </div>
  );
};
