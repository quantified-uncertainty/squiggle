"use client";

import { experimental_useObject as useObject } from "ai/react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { SquigglePlayground } from "@quri/squiggle-components";

import { Simulation } from "../../../components/dist/src/lib/hooks/useSimulator";
import { useAvailableHeight } from "./utils/useAvailableHeight";

export interface ModelInfo {
  presentedTitle: string;
  backendTitle: string;
  company: string;
  fullModelId: string;
}

// Schemas
const squiggleSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
});

// Extend schema to handle an array of responses
const squiggleResponseSchema = z.array(squiggleSchema);

type Action = {
  id: string;
  prompt: string;
  result?: string;
  code?: string;
  status: "loading" | "success" | "error";
  timestamp: Date;
};

type SquiggleResponse = z.infer<typeof squiggleResponseSchema>;

// Action Component
const ActionComponent: React.FC<{ action: Action }> = ({ action }) => {
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
// Main Component
export default function Home() {
  // State
  const [prompt, setPrompt] = useState(
    "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative."
  );

  const [playgroundOpacity, setPlaygroundOpacity] = useState(100);
  const [actions, setActions] = useState<Action[]>([]);
  const [squiggleResponses, setSquiggleResponses] =
    useState<SquiggleResponse | null>(null);
  const [numPlaygrounds, setNumPlaygrounds] = useState(1);

  const { ref, height } = useAvailableHeight();

  const { object, submit, isLoading, stop } = useObject({
    api: "/api/completion",
    schema: squiggleResponseSchema,
  });

  useEffect(() => {
    if (object) {
      setPlaygroundOpacity(100);
      setSquiggleResponses(object.slice(0, numPlaygrounds));
      object
        .slice(0, numPlaygrounds)
        .forEach((response, index) =>
          updateLastAction("success", response.code, `Response ${index + 1}`)
        );
    }
  }, [object, numPlaygrounds]);

  // Helper functions
  const updateLastAction = useCallback(
    (status: Action["status"], code?: string, result?: string) => {
      setActions((prevActions) => {
        const updatedActions = [...prevActions];
        if (updatedActions.length > 0) {
          const lastAction = updatedActions[updatedActions.length - 1];
          lastAction.status = status;
          if (code) lastAction.code = code;
          if (result) lastAction.result = result;
        }
        return updatedActions;
      });
    },
    []
  );

  // Event handlers
  const handleSubmit = () => {
    setPlaygroundOpacity(50);
    const newAction: Action = {
      id: Date.now().toString(),
      prompt,
      status: "loading",
      timestamp: new Date(),
    };
    setActions((prevActions) => [...prevActions, newAction]);

    submit({
      prompt,
      previousPrompt: newAction.prompt,
      previousCode: newAction.code,
      previousResult: newAction.result,
      numPlaygrounds, // Pass the number of playgrounds to the API
    });

    setPrompt("");
  };

  const handleStop = () => {
    stop();
    setPlaygroundOpacity(100);
    updateLastAction("error", undefined, "Generation stopped by user");
  };

  const handleNumPlaygroundsChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setNumPlaygrounds(Number(e.target.value));
  };

  return (
    <div className="flex h-screen text-sm">
      {/* Left column: Chat, Form, and Actions */}
      <div className="flex w-1/5 flex-col px-2 py-2">
        <div className="mb-4 flex">
          <textarea
            className="flex-grow rounded-l border p-2 text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
            rows={10}
          />
        </div>
        <div className="mb-4">
          <select
            className="w-full rounded border p-2"
            value={numPlaygrounds}
            onChange={handleNumPlaygroundsChange}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num} Run{num > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          className="rounded-r bg-blue-500 px-4 py-2 text-sm text-white"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Send"}
        </button>
        {isLoading && (
          <button
            className="mb-4 rounded bg-red-500 px-4 py-2 text-sm text-white"
            onClick={handleStop}
          >
            Stop Generation
          </button>
        )}
        <div className="flex-grow overflow-y-auto">
          <h2 className="text-md mb-2 font-bold">Actions</h2>
          {actions.map((action) => (
            <ActionComponent key={action.id} action={action} />
          ))}
        </div>
      </div>
      {/* Right column: SquigglePlaygrounds */}
      <div
        className="w-4/5 px-2"
        style={{ opacity: playgroundOpacity / 100, height: height || "auto" }}
        ref={ref}
      >
        {squiggleResponses &&
          squiggleResponses.map((response, index) => (
            <div key={actions.at(-1)?.id + index}>
              <SquigglePlayground
                key={response.code}
                defaultCode={
                  response.code || "// Your Squiggle code will appear here"
                }
                height={height / numPlaygrounds}
                onNewSimulation={(simulation: Simulation) => {
                  updateLastAction(
                    simulation.output.ok ? "success" : "error",
                    undefined,
                    JSON.stringify(simulation.output, null, 2)
                  );
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
