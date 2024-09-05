"use client";

import { experimental_useObject as useObject } from "ai/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MarkdownViewer } from "@quri/squiggle-components";

import { linkerWithDefaultSquiggleLibs } from "../llmRunner/processSquiggleCode";
import { ActionComponent } from "./ActionComponent";
import SquigglePlayground from "./SquigglePlayground";
import {
  Action,
  CreateRequestBody,
  SquiggleResponse,
  squiggleResponseSchema,
} from "./utils/squiggleTypes";
import { useAvailableHeight } from "./utils/useAvailableHeight";

const LogsView: React.FC<{ onClose: () => void; logSummary: string }> = ({
  onClose,
  logSummary,
}) => {
  return (
    <div className="h-full w-full bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Logs</h2>
        <button
          className="rounded bg-red-500 px-4 py-2 text-white"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <MarkdownViewer
        md={logSummary}
        textSize="sm"
        linker={linkerWithDefaultSquiggleLibs}
      />
    </div>
  );
};

export default function CreatePage() {
  // State
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [prompt, setPrompt] = useState(
    "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative."
  );
  const [squiggleCode, setSquiggleCode] = useState("");
  const [playgroundOpacity, setPlaygroundOpacity] = useState(100);
  const [actions, setActions] = useState<Action[]>([]);
  const [squiggleResponses, setSquiggleResponses] =
    useState<SquiggleResponse | null>(null);

  const numPlaygrounds = 1;
  const [selectedRunIndex, setSelectedRunIndex] = useState<number | null>(null);
  const [selectedLogsIndex, setSelectedLogsIndex] = useState<number | null>(
    null
  );

  const { ref, height } = useAvailableHeight();

  const { object, submit, isLoading, stop, error } = useObject({
    api: "/api/create",
    schema: squiggleResponseSchema,
  });

  const isReallyLoading = isLoading && !error;

  const responses = useMemo(
    () =>
      object?.slice(0, numPlaygrounds).filter(
        (response): response is SquiggleResponse[number] =>
          // `useObject` can return partial objects, so we check that response is fully defined.
          // This is mostly to satisfy TypeScript, because in practice /api/create always returns a fully defined response.
          !!response &&
          response.code !== undefined &&
          response.logSummary !== undefined
        // (we don't check for other fields but that's ok)
      ) ?? [],
    [object, numPlaygrounds]
  );

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

  useEffect(() => {
    if (error) {
      setPlaygroundOpacity(100);
      updateLastAction("error", undefined, `Error: ${error.toString()}`);
    } else if (responses.length > 0) {
      setPlaygroundOpacity(100);
      setSquiggleResponses(responses);
      responses.forEach((response, index) =>
        updateLastAction(
          "success",
          response.code,
          `Response ${index + 1}\nPrice: $${response.totalPrice.toFixed(4)}\nTime: ${response.runTimeMs / 1000}s\nLLM Runs: ${response.llmRunCount}`
        )
      );
    }
  }, [responses, updateLastAction, error]);

  // Helper functions
  const handleToggleLogs = (index: number | null) => {
    setSelectedLogsIndex(index);
    setSelectedRunIndex(null);
  };

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

    const requestBody: CreateRequestBody = {
      prompt: mode === "create" ? prompt : undefined,
      squiggleCode: mode === "edit" ? squiggleCode : undefined,
    };

    submit(requestBody);

    setPrompt("");
  };

  const handleStop = () => {
    stop();
    setPlaygroundOpacity(100);
    updateLastAction("error", undefined, "Generation stopped by user");
  };

  const handleEditVersion = (index: number) => {
    setSelectedRunIndex(null);
    setMode("edit");
    setSquiggleCode(squiggleResponses?.[index]?.code || "");
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
      {selectedLogsIndex === null ? (
        <>
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
                Fix
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
            <button
              className="rounded-r bg-blue-500 px-4 py-2 text-sm text-white"
              onClick={handleSubmit}
              disabled={isReallyLoading}
            >
              {isReallyLoading ? "Generating..." : "Send"}
            </button>
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
            style={{
              opacity: playgroundOpacity / 100,
              height: height || "auto",
            }}
            ref={ref}
          >
            {squiggleResponses &&
              squiggleResponses.map((response, index) => (
                <div
                  key={(actions.at(-1)?.id ?? "null") + index}
                  className={`mb-4 ${selectedRunIndex !== null && selectedRunIndex !== index ? "hidden" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between rounded bg-gray-100 p-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Run {index + 1}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {(response.runTimeMs / 1000).toFixed(2)}s
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
                          ? "Fix"
                          : "Fix this version"}
                      </button>
                      <button
                        className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                        onClick={() => handleToggleLogs(index)}
                      >
                        Open Logs
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
                    height={
                      height
                        ? selectedRunIndex === null
                          ? height / numPlaygrounds - 40
                          : height - 40
                        : 200
                    }
                    defaultCode={
                      response.code || "// Your Squiggle code will appear here"
                    }
                  />
                </div>
              ))}
          </div>
        </>
      ) : (
        <LogsView
          onClose={() => handleToggleLogs(null)}
          logSummary={squiggleResponses?.[selectedLogsIndex]?.logSummary || ""}
        />
      )}
    </div>
  );
}
