"use client";

import { experimental_useObject as useObject } from "ai/react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
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

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    presentedTitle: "GPT-3.5",
    backendTitle: "gpt4-3.5-turbo",
    company: "OpenAI",
    fullModelId: "gpt-3.5-turbo",
  },
  {
    presentedTitle: "GPT-4 Turbo",
    backendTitle: "gpt4o",
    company: "OpenAI",
    fullModelId: "gpt-4o",
  },
  {
    presentedTitle: "Claude 3 Haiku",
    backendTitle: "haiku",
    company: "Anthropic",
    fullModelId: "claude-3-haiku-20240307",
  },
  {
    presentedTitle: "Claude 3 Sonnet",
    backendTitle: "sonnet",
    company: "Anthropic",
    fullModelId: "claude-3-5-sonnet-20240620",
  },
];

// Schemas
const squiggleSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
});

// Types
type Action = {
  id: string;
  prompt: string;
  model: string;
  result?: string;
  code?: string;
  status: "loading" | "success" | "error";
  timestamp: Date;
};

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
          <p>
            <strong>Model:</strong> {action.model}
          </p>
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
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(
    AVAILABLE_MODELS[0]
  );
  const [playgroundOpacity, setPlaygroundOpacity] = useState(100);
  const [actions, setActions] = useState<Action[]>([]);

  const { ref, height } = useAvailableHeight(); // Use useAvailableHeight hook

  // Hooks
  const { object, submit, isLoading, stop } = useObject({
    api: "/api/completion",
    schema: squiggleSchema,
  });

  useEffect(() => {
    if (object?.code) {
      setPlaygroundOpacity(100);
      updateLastAction("success", object.code);
    }
  }, [object?.code]);

  // Helper functions
  const updateLastAction = (
    status: Action["status"],
    code?: string,
    result?: string
  ) => {
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
  };

  // Event handlers
  const handleSubmit = () => {
    setPlaygroundOpacity(50);
    const newAction: Action = {
      id: Date.now().toString(),
      prompt,
      model: selectedModel.backendTitle,
      status: "loading",
      timestamp: new Date(),
    };
    setActions((prevActions) => [...prevActions, newAction]);

    const recentAction = actions.at(-1);
    console.log("actions", actions, "recent", recentAction);
    const previousResult = !recentAction
      ? "No recent Action"
      : recentAction.result === "error"
        ? recentAction.result
        : "Run was a success";
    submit({
      prompt,
      model: selectedModel.backendTitle,
      previousPrompt: recentAction?.prompt,
      previousCode: recentAction?.code,
      previousResult,
    });
    setPrompt("");
  };

  const handleStop = () => {
    stop();
    setPlaygroundOpacity(100);
    updateLastAction("error", undefined, "Generation stopped by user");
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel =
      AVAILABLE_MODELS.find((m) => m.backendTitle === e.target.value) ||
      AVAILABLE_MODELS[0];
    setSelectedModel(newModel);
  };

  return (
    <div className="flex h-screen text-sm">
      {/* Left column: Chat, Form, and Actions */}
      <div className="flex w-1/5 flex-col px-2 py-2">
        <div className="mb-4">
          <select
            className="w-full rounded border p-2"
            value={selectedModel.backendTitle}
            onChange={handleModelChange}
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.backendTitle} value={model.backendTitle}>
                {model.presentedTitle} ({model.company})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4 flex">
          <textarea
            className="flex-grow rounded-l border p-2 text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
            rows={10}
          />
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
      {/* Right column: SquigglePlayground */}
      <div
        className="w-4/5 px-2"
        style={{ opacity: playgroundOpacity / 100, height: height || "auto" }}
        ref={ref} // Attach the ref here
      >
        <SquigglePlayground
          defaultCode={object?.code || "// Your Squiggle code will appear here"}
          key={object?.code}
          height={height}
          onNewSimulation={(simulation: Simulation) => {
            console.log("NEW SIMULATION", simulation);
            updateLastAction(
              simulation.output.ok ? "success" : "error",
              undefined,
              JSON.stringify(simulation.output, null, 2)
            );
          }}
        />
      </div>
    </div>
  );
}
