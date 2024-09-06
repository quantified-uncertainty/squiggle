"use client";

import { experimental_useObject as useObject } from "ai/react";
import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, StyledTab } from "@quri/ui";

import { StyledTextArea } from "../../../ui/dist/forms/styled/StyledTextArea";
import { ActionComponent } from "./ActionComponent";
import { Badge } from "./Badge";
import { LogsView } from "./LogsView";
import SquigglePlayground from "./SquigglePlayground";
import {
  Action,
  CreateRequestBody,
  SquiggleResponse,
  squiggleResponseSchema,
} from "./utils/squiggleTypes";
import { useAvailableHeight } from "./utils/useAvailableHeight";

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

  const handleSelectRun = (index: number) => setSelectedRunIndex(index);

  const handleCloseSelectedRun = () => setSelectedRunIndex(null);

  return selectedLogsIndex === null ? (
    <div className="flex h-screen">
      {/* Left column: Mode Toggle, Chat, Form, and Actions */}
      <div
        className={clsx("w-1/5 p-2", selectedRunIndex !== null ? "hidden" : "")}
      >
        <StyledTab.Group
          selectedIndex={mode === "edit" ? 1 : 0}
          onChange={(index) => setMode(index === 0 ? "create" : "edit")}
        >
          <StyledTab.List stretch theme="primary">
            <StyledTab name="Create" />
            <StyledTab name="Fix" />
          </StyledTab.List>
          <div className="mb-4 mt-2">
            <StyledTab.Panels>
              <StyledTab.Panel>
                <StyledTextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt here"
                  rows={10}
                  minRows={10}
                />
              </StyledTab.Panel>
              <StyledTab.Panel>
                <StyledTextArea
                  value={squiggleCode}
                  onChange={(e) => setSquiggleCode(e.target.value)}
                  placeholder="Enter your Squiggle code here"
                  rows={12}
                  minRows={12}
                />
              </StyledTab.Panel>
            </StyledTab.Panels>
          </div>
        </StyledTab.Group>
        <Button
          theme="primary"
          wide
          onClick={handleSubmit}
          disabled={isReallyLoading}
        >
          {isReallyLoading ? "Generating..." : "Send"}
        </Button>
        <div className="mt-4 flex-grow overflow-y-auto">
          <h2 className="mb-2 text-sm font-bold">Actions</h2>
          <div className="flex flex-col space-y-2">
            {actions.map((action) => (
              <ActionComponent key={action.id} action={action} />
            ))}
          </div>
        </div>
      </div>
      {/* Right column: SquigglePlaygrounds */}
      <div
        className={clsx("px-2", selectedRunIndex !== null ? "w-full" : "w-4/5")}
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
              className={clsx(
                "mb-4",
                selectedRunIndex !== null &&
                  selectedRunIndex !== index &&
                  "hidden"
              )}
            >
              <div className="mb-2 flex items-center justify-between rounded bg-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Run {index + 1}</span>
                  <Badge theme="blue">
                    {(response.runTimeMs / 1000).toFixed(2)}s
                  </Badge>
                  <Badge theme="green">${response.totalPrice.toFixed(4)}</Badge>
                  <Badge theme="purple">{response.llmRunCount} LLM runs</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    theme="primary"
                    onClick={() => handleEditVersion(index)}
                  >
                    {squiggleResponses.length === 1
                      ? "Fix"
                      : "Fix this version"}
                  </Button>
                  <Button onClick={() => handleToggleLogs(index)}>
                    Open Logs
                  </Button>
                  {selectedRunIndex === null ? (
                    <Button onClick={() => handleSelectRun(index)}>
                      Full View
                    </Button>
                  ) : (
                    <Button theme="primary" onClick={handleCloseSelectedRun}>
                      Close
                    </Button>
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
    </div>
  ) : (
    <LogsView
      onClose={() => handleToggleLogs(null)}
      logSummary={squiggleResponses?.[selectedLogsIndex]?.logSummary || ""}
    />
  );
}
