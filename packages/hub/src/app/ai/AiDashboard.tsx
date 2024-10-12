"use client";

import { clsx } from "clsx";
import { FC, useRef, useState } from "react";

import { ClientWorkflow, ClientWorkflowResult } from "@quri/squiggle-ai";

import { Sidebar } from "./Sidebar";
import { useSquiggleWorkflows } from "./useSquiggleWorkflows";
import { WorkflowViewer } from "./WorkflowViewer";

export type SquiggleResponse = {
  result?: ClientWorkflowResult;
  currentStep?: string;
};

export const AiDashboard: FC<{ initialWorkflows: ClientWorkflow[] }> = ({
  initialWorkflows,
}) => {
  const { workflows, submitWorkflow, selectedWorkflow, selectWorkflow } =
    useSquiggleWorkflows(initialWorkflows);

  const [collapsedSidebar, setCollapsedSidebar] = useState(false);

  const sidebarRef = useRef<{ edit: (code: string) => void }>(null);

  const handleEditVersion = (code: string) => {
    setCollapsedSidebar(false);
    sidebarRef.current?.edit(code);
  };

  return (
    <div className="flex">
      {/* Left column: Mode Toggle, Chat, Form, and list of Workflows */}
      <div className={clsx("w-1/5 p-2", collapsedSidebar && "hidden")}>
        <Sidebar
          submitWorkflow={submitWorkflow}
          selectWorkflow={selectWorkflow}
          selectedWorkflow={selectedWorkflow}
          workflows={workflows}
          ref={sidebarRef}
        />
      </div>
      {/* Right column: Menu and SquigglePlayground */}
      {selectedWorkflow && (
        <div className="flex-1">
          <WorkflowViewer
            key={selectedWorkflow.id}
            workflow={selectedWorkflow}
            onFix={handleEditVersion}
            expanded={collapsedSidebar}
            setExpanded={setCollapsedSidebar}
          />
        </div>
      )}
    </div>
  );
};
