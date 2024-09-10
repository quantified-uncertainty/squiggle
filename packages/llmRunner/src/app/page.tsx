"use client";

import { clsx } from "clsx";
import {
  FC,
  Reducer,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { Button, StyledTab } from "@quri/ui";

import { StyledTextArea } from "../../../ui/dist/forms/styled/StyledTextArea";
import { Badge } from "./Badge";
import { LogsView } from "./LogsView";
import SquigglePlayground from "./SquigglePlayground";
import {
  CreateRequestBody,
  SquiggleWorkflowResult,
  WorkflowDescription,
  workflowMessageSchema,
} from "./utils/squiggleTypes";
import { useAvailableHeight } from "./utils/useAvailableHeight";
import { WorkflowRunComponent } from "./WorkflowRunComponent";

type SquiggleResponse = {
  result?: SquiggleWorkflowResult;
  currentStep?: string;
};

function useSquiggleResponse() {
  const [object, setObject] = useState<SquiggleResponse | undefined>();
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
              console.log(chunk);
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
        } else if (event.kind === "startStep") {
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

function useWorkflowsReducer() {
  type State = WorkflowDescription[];
  type Action =
    | {
        type: "add";
        payload: WorkflowDescription;
      }
    | {
        type: "updateLast";
        payload: Partial<WorkflowDescription>;
      };

  const reducer: Reducer<State, Action> = (state, action) => {
    switch (action.type) {
      case "add":
        return [...state, action.payload];
      case "updateLast":
        return [
          ...state.slice(0, -1),
          { ...state[state.length - 1], ...action.payload },
        ];
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, []);

  const addWorkflow = useCallback((workflow: WorkflowDescription) => {
    dispatch({
      type: "add",
      payload: workflow,
    });
  }, []);

  const updateLastWorkflow = useCallback(
    (workflowRun: Partial<WorkflowDescription>) => {
      dispatch({
        type: "updateLast",
        payload: workflowRun,
      });
    },
    []
  );

  return {
    workflows: state,
    addWorkflow,
    updateLastWorkflow,
  };
}

const ResponseViewer: FC<{
  object: SquiggleResponse;
  onFix: () => void;
  onViewLogs: () => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  inProgress: boolean;
}> = ({ object, onFix, onViewLogs, expanded, setExpanded, inProgress }) => {
  const { ref, height } = useAvailableHeight();

  return (
    <div
      className="px-2"
      style={{
        opacity: inProgress ? 0.5 : 1,
        height: height || "auto",
      }}
      ref={ref}
    >
      {object.result && (
        <div>
          <div className="mb-2 flex items-center justify-between rounded bg-gray-100 p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Run</span>
              <Badge theme="blue">
                {(object.result.runTimeMs / 1000).toFixed(2)}s
              </Badge>
              <Badge theme="green">
                ${object.result.totalPrice.toFixed(4)}
              </Badge>
              <Badge theme="purple">{object.result.llmRunCount} LLM runs</Badge>
            </div>
            <div className="flex gap-2">
              <Button theme="primary" onClick={() => onFix()}>
                Fix
              </Button>
              <Button onClick={() => onViewLogs()}>Open Logs</Button>
              {expanded ? (
                <Button theme="primary" onClick={() => setExpanded(false)}>
                  Close
                </Button>
              ) : (
                <Button onClick={() => setExpanded(true)}>Full View</Button>
              )}
            </div>
          </div>
          <SquigglePlayground
            height={height ? height - 60 : 200}
            defaultCode={
              object.result.code || "// Your Squiggle code will appear here"
            }
          />
        </div>
      )}
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
  const [inProgress, setInProgress] = useState(false);

  const { workflows, addWorkflow, updateLastWorkflow } = useWorkflowsReducer();

  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [viewLogs, setViewLogs] = useState(false);

  const { object, submit, isLoading, stop, error } = useSquiggleResponse();

  const isReallyLoading = isLoading && !error;

  const [renderedObject, setRenderedObject] = useState<
    SquiggleResponse | undefined
  >();

  useEffect(() => {
    if (error) {
      setInProgress(false);
      updateLastWorkflow({
        status: "error",
        result: `Error: ${error.toString()}`,
      });
    } else if (object) {
      const { result } = object;

      if (result) {
        setInProgress(false);
        setRenderedObject(object);
        updateLastWorkflow({
          status: result.isValid ? "success" : "error",
          code: result.code,
          result: `Price: $${result.totalPrice.toFixed(4)}\nTime: ${result.runTimeMs / 1000}s\nLLM Runs: ${result.llmRunCount}`,
        });
      } else {
        updateLastWorkflow({
          currentStep: object.currentStep,
        });
      }
    }
  }, [object, error, updateLastWorkflow]);

  // Event handlers
  const handleSubmit = () => {
    setInProgress(true);
    const newRun: WorkflowDescription = {
      id: Date.now().toString(),
      prompt,
      status: "loading",
      timestamp: new Date(),
    };
    addWorkflow(newRun);

    const requestBody: CreateRequestBody = {
      prompt: mode === "create" ? prompt : undefined,
      squiggleCode: mode === "edit" ? squiggleCode : undefined,
    };

    submit(requestBody);

    setPrompt("");
  };

  const handleStop = () => {
    stop();
    setInProgress(false);
    updateLastWorkflow({
      status: "error",
      result: "Generation stopped by user",
    });
  };

  const editRef = useRef<HTMLTextAreaElement>(null);

  const handleEditVersion = () => {
    setCollapsedSidebar(false);
    setMode("edit");
    setSquiggleCode(renderedObject?.result?.code || "");
    setTimeout(() => {
      editRef.current?.focus();
    }, 0);
  };

  return viewLogs ? (
    <LogsView
      onClose={() => setViewLogs(false)}
      logSummary={renderedObject?.result?.logSummary || ""}
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
            {workflows.map((workflow) => (
              <WorkflowRunComponent key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>
      </div>
      {/* Right column: Menu and SquigglePlayground */}
      {renderedObject && (
        <div className="flex-1">
          <ResponseViewer
            object={renderedObject}
            onFix={handleEditVersion}
            onViewLogs={() => setViewLogs(true)}
            expanded={collapsedSidebar}
            setExpanded={setCollapsedSidebar}
            inProgress={inProgress}
          />
        </div>
      )}
    </div>
  );
}
