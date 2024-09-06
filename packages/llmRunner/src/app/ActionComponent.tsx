"use client";

import { FC, useState } from "react";

import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ErrorIcon,
  RefreshIcon,
} from "@quri/ui";

import { Action } from "./utils/squiggleTypes";

export const ActionComponent: FC<{ action: Action }> = ({ action }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (action.status) {
      case "loading":
        return <RefreshIcon className="animate-spin" />;
      case "success":
        return <CheckCircleIcon className="text-green-500" />;
      case "error":
        return <ErrorIcon className="text-red-500" />;
    }
  };

  return (
    <div className="rounded border p-2 text-sm">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="shrink-0">{getStatusIcon()}</div>
          <div className="truncate font-medium">{action.prompt}</div>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </div>
      {expanded && (
        <div className="mt-2">
          <p>{action.prompt}</p>
          <p>
            <strong>Timestamp:</strong> {action.timestamp.toLocaleString()}
          </p>
          <p>
            <strong>Code:</strong>
          </p>
          <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2">
            {action.code || "No code generated"}
          </pre>
          <p>
            <strong>Result:</strong>
          </p>
          <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2">
            {action.result || "No result yet"}
          </pre>
        </div>
      )}
    </div>
  );
};
