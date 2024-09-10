"use client";

import clsx from "clsx";
import { FC } from "react";

import { CheckCircleIcon, ErrorIcon, RefreshIcon } from "@quri/ui";

import { WorkflowDescription } from "./utils/squiggleTypes";

export const WorkflowRunComponent: FC<{
  workflow: WorkflowDescription;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ workflow, onSelect, isSelected }) => {
  const getStatusIcon = () => {
    switch (workflow.status) {
      case "loading":
        return <RefreshIcon className="animate-spin" />;
      case "finished":
        return workflow.result.isValid ? (
          <CheckCircleIcon className="text-green-500" />
        ) : (
          <ErrorIcon className="text-red-500" />
        );
      case "error":
        return <ErrorIcon className="text-red-500" />;
    }
  };

  return (
    <div
      className={clsx(
        "rounded border p-2 text-sm",
        isSelected ? "bg-gray-100" : "cursor-pointer"
      )}
      onClick={isSelected ? undefined : onSelect}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <div className="shrink-0">{getStatusIcon()}</div>
        <div className="truncate font-medium">{workflow.request.prompt}</div>
      </div>
      {workflow.status === "loading" && (
        <div className="mt-2">
          <p>{workflow.currentStep}</p>
        </div>
      )}
    </div>
  );
};
