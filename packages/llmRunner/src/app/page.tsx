"use client";

import { clsx } from "clsx";
import { useRef, useState } from "react";

import { Sidebar } from "./Sidebar";
import { useSquiggleWorkflows } from "./useSquiggleWorkflows";
import { SquiggleWorkflowResult } from "./utils/squiggleTypes";
import { WorkflowViewer } from "./WorkflowViewer";

export type SquiggleResponse = {
  result?: SquiggleWorkflowResult;
  currentStep?: string;
};

export default function CreatePage() {
  const { workflows, submitWorkflow, selectedWorkflow, selectWorkflow } =
    useSquiggleWorkflows();

  const [collapsedSidebar, setCollapsedSidebar] = useState(false);

  const sidebarRef = useRef<{ edit: (code: string) => void }>(null);

  const handleEditVersion = (code: string) => {
    setCollapsedSidebar(false);
    sidebarRef.current?.edit(code);
  };

  return (
    <div className="flex h-screen">
      {/* Left column: Mode Toggle, Chat, Form, and list of Workflows */}
      <div
        className={clsx(
          "mr-2 w-1/5 border-r border-slate-200 p-2",
          collapsedSidebar && "hidden"
        )}
      >
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
}
