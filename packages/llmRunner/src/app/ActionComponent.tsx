"use client";

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader,
  XCircle,
} from "lucide-react";
import { FC, useState } from "react";

import { Action } from "./utils/squiggleTypes";

export const ActionComponent: FC<{ action: Action }> = ({ action }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (action.status) {
      case "loading":
        return <Loader className="animate-spin" />;
      case "success":
        return <CheckCircle className="text-green-500" />;
      case "error":
        return <XCircle className="text-red-500" />;
    }
  };

  return (
    <div className="mb-2 rounded border p-2">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium">
            {action.prompt.substring(0, 30)}...
          </span>
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
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
          <pre className="mt-1 rounded bg-gray-100 p-2">
            {action.code || "No code generated"}
          </pre>
          <p>
            <strong>Result:</strong>
          </p>
          <pre className="mt-1 rounded bg-gray-100 p-2">
            {action.result || "No result yet"}
          </pre>
        </div>
      )}
    </div>
  );
};
