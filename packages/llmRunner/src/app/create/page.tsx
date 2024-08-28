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

import { SquigglePlayground } from "@quri/squiggle-components";

import {
  Action,
  CreateRequestBody,
  SquiggleResponse,
  squiggleResponseSchema,
} from "../utils/squiggleTypes";
import { useAvailableHeight } from "../utils/useAvailableHeight";

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
export default function CreatePage() {
  // State
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [prompt, setPrompt] = useState(
    "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative."
  );
  const [squiggleCode, setSquiggleCode] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [playgroundOpacity, setPlaygroundOpacity] = useState(100);
  const [actions, setActions] = useState<Action[]>([]);
  const [squiggleResponses, setSquiggleResponses] =
    useState<SquiggleResponse | null>(null);
  const [numPlaygrounds, setNumPlaygrounds] = useState(1);
  const [selectedPlaygroundIndex, setSelectedPlaygroundIndex] = useState<
    number | null
  >(null);
  const [selectedRunIndex, setSelectedRunIndex] = useState<number | null>(null);

  const { ref, height } = useAvailableHeight();

  const { object, submit, isLoading, stop } = useObject({
    api: "/api/create",
    schema: squiggleResponseSchema,
  });

  useEffect(() => {
    if (object) {
      setPlaygroundOpacity(100);
      setSquiggleResponses(object.slice(0, numPlaygrounds));
      object
        .slice(0, numPlaygrounds)
        .forEach((response, index) =>
          updateLastAction(
            "success",
            response.code,
            `Response ${index + 1}\nPrice: $${response.totalPrice.toFixed(4)}\nTime: ${response.runTimeMs}ms\nLLM Runs: ${response.llmRunCount}`
          )
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
      prompt: mode === "create" ? prompt : editPrompt,
      status: "loading",
      timestamp: new Date(),
    };
    setActions((prevActions) => [...prevActions, newAction]);

    const requestBody: CreateRequestBody = {
      prompt: mode === "create" ? prompt : editPrompt,
      previousPrompt: newAction.prompt,
      previousCode: newAction.code,
      previousResult: newAction.result,
      numPlaygrounds,
      squiggleCode: mode === "edit" ? squiggleCode : undefined,
    };

    submit(requestBody);

    if (mode === "create") {
      setPrompt("");
    } else {
      setEditPrompt("");
    }
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

  const handleEditVersion = (index: number) => {
    setSelectedRunIndex(null);
    setMode("edit");
    setSquiggleCode(squiggleResponses?.[index]?.code || "");
    setSelectedPlaygroundIndex(index);
    // Focus on the prompt text field
    setTimeout(() => {
      const promptTextarea = document.getElementById("edit-prompt-textarea");
      if (promptTextarea) {
        (promptTextarea as HTMLTextAreaElement).focus();
      }
    }, 0);
  };

  const handleSelectRun = (index: number) => {
    setSelectedRunIndex(index);
  };

  const handleCloseSelectedRun = () => {
    setSelectedRunIndex(null);
  };

  return (
    <div className="flex h-screen text-sm">
      {/* Left column: Mode Toggle, Chat, Form, and Actions */}
      <div
        className={`flex w-1/5 flex-col px-2 py-2 ${selectedRunIndex !== null ? "hidden" : ""}`}
      >
        <div className="mb-4 flex">
          <button
            className={`flex-1 rounded-l p-2 ${
              mode === "create" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setMode("create")}
          >
            Create
          </button>
          <button
            className={`flex-1 rounded-r p-2 ${
              mode === "edit" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
        </div>
        {mode === "create" ? (
          <div className="mb-4 flex">
            <textarea
              className="flex-grow rounded-l border p-2 text-sm"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here"
              rows={10}
            />
          </div>
        ) : (
          <>
            <div className="mb-2">
              <h3 className="font-semibold"> Prompt</h3>
            </div>
            <div className="mb-4 flex">
              <textarea
                className="flex-grow rounded-l border p-2 text-sm"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What changes would you like to make?"
                rows={8}
              />
            </div>
            <div className="mb-2">
              <h3 className="font-semibold">Squiggle Code</h3>
            </div>
            <div className="mb-4 flex">
              <textarea
                className="flex-grow rounded-l border p-2 text-sm"
                value={squiggleCode}
                onChange={(e) => setSquiggleCode(e.target.value)}
                placeholder="Enter your Squiggle code here"
                rows={12}
              />
            </div>
          </>
        )}
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
        className={`px-2 ${selectedRunIndex !== null ? "w-full" : "w-4/5"}`}
        style={{ opacity: playgroundOpacity / 100, height: height || "auto" }}
        ref={ref}
      >
        {squiggleResponses &&
          squiggleResponses.map((response, index) => (
            <div
              key={actions.at(-1)?.id + index}
              className={`mb-4 ${selectedRunIndex !== null && selectedRunIndex !== index ? "hidden" : ""}`}
            >
              <div className="mb-2 flex items-center justify-between rounded bg-gray-100 p-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Run {index + 1}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    {response.runTimeMs.toFixed(2)}ms
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                    ${response.totalPrice.toFixed(4)}
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
                    {response.llmRunCount} LLM runs
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="rounded bg-blue-500 px-4 py-2 text-white"
                    onClick={() => handleEditVersion(index)}
                  >
                    {squiggleResponses.length === 1
                      ? "Edit"
                      : "Edit this version"}
                  </button>
                  {selectedRunIndex === null ? (
                    <button
                      className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                      onClick={() => handleSelectRun(index)}
                    >
                      Full View
                    </button>
                  ) : (
                    <button
                      className="rounded bg-red-500 px-4 py-2 text-white"
                      onClick={handleCloseSelectedRun}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
              <SquigglePlayground
                key={response.code}
                defaultCode={
                  response.code || "// Your Squiggle code will appear here"
                }
                height={
                  selectedRunIndex === null
                    ? height / numPlaygrounds - 40
                    : height - 40
                }
              />
            </div>
          ))}
      </div>
    </div>
  );
}
