"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, StyledTab } from "@quri/ui";

import { StyledTextArea } from "../../../ui/dist/forms/styled/StyledTextArea";
import { ActionComponent } from "./ActionComponent";
import { Badge } from "./Badge";
import { LogsView } from "./LogsView";
import SquigglePlayground from "./SquigglePlayground";
import {
  Action,
  CreateRequestBody,
  SquiggleWorkflowResult,
  workflowMessageSchema,
} from "./utils/squiggleTypes";
import { useAvailableHeight } from "./utils/useAvailableHeight";

function useSquiggleResponse() {
  const [object, setObject] = useState<
    | {
        result?: SquiggleWorkflowResult;
        currentStep?: string;
      }
    | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const stop = useCallback(() => {
    // FIXME - cancel fetch
  }, []);

  const submit = useCallback(async (request: CreateRequestBody) => {
    try {
      setObject(undefined);
      setError(undefined);
      setIsLoading(true);
      const response = await fetch("/api/create", {
        method: "POST",
        body: JSON.stringify(request),
      });

      if (!response.body) {
        return; // FIXME: Handle this case
      }

      let buffer = "";
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(
          new TransformStream<string, string>({
            transform(chunk, controller) {
              buffer += chunk;
              const lines = buffer.split("\n");

              // Process all complete lines
              for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line) controller.enqueue(line);
              }

              // Keep the last (potentially incomplete) line in the buffer
              buffer = lines[lines.length - 1];
            },
            flush(controller) {
              // Process any remaining data in the buffer
              if (buffer.trim()) controller.enqueue(buffer.trim());
            },
          })
        )
        .getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the JSON string
        const eventJson = JSON.parse(value);
        const event = workflowMessageSchema.parse(eventJson);
        if (event.kind === "finalResult") {
          setObject((object) => ({ ...object, result: event.content }));
        } else if (event.kind === "currentStep") {
          setObject((object) => ({
            ...object,
            currentStep: event.content.step,
          }));
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { object, submit, isLoading, stop, error };
}

export default function CreatePage() {
  // State
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [prompt, setPrompt] = useState(
    "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative."
  );
  const [squiggleCode, setSquiggleCode] = useState("");
  const [playgroundOpacity, setPlaygroundOpacity] = useState(100);
  const [actions, setActions] = useState<Action[]>([]);

  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [viewLogs, setViewLogs] = useState(false);

  const { ref, height } = useAvailableHeight();

  const { object, submit, isLoading, stop, error } = useSquiggleResponse();

  const isReallyLoading = isLoading && !error;

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
    } else if (object?.result) {
      const { result } = object;
      setPlaygroundOpacity(100);
      updateLastAction(
        "success",
        result.code,
        `Price: $${result.totalPrice.toFixed(4)}\nTime: ${result.runTimeMs / 1000}s\nLLM Runs: ${result.llmRunCount}`
      );
    }
  }, [object, error, updateLastAction]);

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

  const editRef = useRef<HTMLTextAreaElement>(null);

  const handleEditVersion = () => {
    setCollapsedSidebar(false);
    setMode("edit");
    setSquiggleCode(object?.result?.code || "");
    setTimeout(() => {
      editRef.current?.focus();
    }, 0);
  };

  return viewLogs ? (
    <LogsView
      onClose={() => setViewLogs(false)}
      logSummary={object?.result?.logSummary || ""}
    />
  ) : (
    <div className="flex h-screen">
      {/* Left column: Mode Toggle, Chat, Form, and Actions */}
      <div className={clsx("w-1/5 p-2", collapsedSidebar && "hidden")}>
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
                  ref={editRef}
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
        className={clsx("px-2", collapsedSidebar ? "w-full" : "w-4/5")}
        style={{
          opacity: playgroundOpacity / 100,
          height: height || "auto",
        }}
        ref={ref}
      >
        {object?.result && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between rounded bg-gray-100 p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Run</span>
                <Badge theme="blue">
                  {(object.result.runTimeMs / 1000).toFixed(2)}s
                </Badge>
                <Badge theme="green">
                  ${object.result.totalPrice.toFixed(4)}
                </Badge>
                <Badge theme="purple">
                  {object.result.llmRunCount} LLM runs
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button theme="primary" onClick={() => handleEditVersion()}>
                  Fix
                </Button>
                <Button onClick={() => setViewLogs(true)}>Open Logs</Button>
                {collapsedSidebar ? (
                  <Button
                    theme="primary"
                    onClick={() => setCollapsedSidebar(false)}
                  >
                    Close
                  </Button>
                ) : (
                  <Button onClick={() => setCollapsedSidebar(true)}>
                    Full View
                  </Button>
                )}
              </div>
            </div>
            <SquigglePlayground
              height={height ? height - 40 : 200}
              defaultCode={
                object.result.code || "// Your Squiggle code will appear here"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
