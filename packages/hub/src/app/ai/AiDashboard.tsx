"use client";

import { FC, useRef } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { Sidebar } from "./Sidebar";
import { useSquiggleWorkflows } from "./useSquiggleWorkflows";
import { WorkflowViewer } from "./WorkflowViewer";

type Props = {
  initialWorkflows: ClientWorkflow[];
  hasMoreWorkflows: boolean;
};

export const AiDashboard: FC<Props> = ({
  initialWorkflows,
  hasMoreWorkflows,
}: Props) => {
  const { workflows, submitWorkflow, selectedWorkflow, selectWorkflow } =
    useSquiggleWorkflows(initialWorkflows);

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
          hasMoreWorkflows={hasMoreWorkflows}
          ref={sidebarRef}
        />
      </div>
      {/* Right column: Menu and SquigglePlayground */}
      {selectedWorkflow && (
        <div className="min-w-0 flex-1 overflow-x-auto">
          <WorkflowViewer
            key={selectedWorkflow.id}
            workflow={selectedWorkflow}
          />
        </div>
      )}
    </div>
  );
};
