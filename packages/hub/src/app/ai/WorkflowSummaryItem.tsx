"use client";

import clsx from "clsx";
import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { WorkflowName } from "./WorkflowName";
import { WorkflowStatusIcon } from "./WorkflowStatusIcon";

export const WorkflowSummaryItem: FC<{
  workflow: ClientWorkflow;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ workflow, onSelect, isSelected }) => {
  return (
    <div
      className={clsx(
        "w-full border-b p-2 text-sm",
        isSelected ? "bg-gray-100" : "cursor-pointer hover:bg-slate-50"
      )}
      onClick={isSelected ? undefined : onSelect}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <div className="shrink-0">
          <WorkflowStatusIcon workflow={workflow} />
        </div>
        <div className="truncate font-medium">
          <WorkflowName workflow={workflow} />
        </div>
      </div>
      {workflow.status === "loading" && (
        <div className="mt-2">
          <p>{workflow.currentStep}</p>
        </div>
      )}
    </div>
  );
};
