"use client";

import clsx from "clsx";
import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { WorkflowStatusIcon } from "./WorkflowStatusIcon";

export const WorkflowSummaryItem: FC<{
  workflow: ClientWorkflow;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ workflow, onSelect, isSelected }) => {
  return (
    <div
      className={clsx(
        "rounded border p-2 text-sm",
        isSelected ? "bg-gray-100" : "cursor-pointer"
      )}
      onClick={isSelected ? undefined : onSelect}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <div className="shrink-0">
          <WorkflowStatusIcon workflow={workflow} />
        </div>
        <div className="truncate font-medium">{workflow.input.prompt}</div>
      </div>
      {workflow.status === "loading" && (
        <div className="mt-2">
          <p>{workflow.currentStep}</p>
        </div>
      )}
    </div>
  );
};
