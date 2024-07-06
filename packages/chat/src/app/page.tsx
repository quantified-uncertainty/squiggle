"use client";
import { experimental_useObject as useObject } from "ai/react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { SquigglePlayground } from "@quri/squiggle-components";

import { AVAILABLE_MODELS, ModelInfo } from "@/app/utils/llms"; // Adjust the import path as needed

const squiggleSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
});

export default function Home() {
  const [prompt, setPrompt] = useState(
    "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative."
  );
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(
    AVAILABLE_MODELS[0]
  );
  const [playgroundOpacity, setPlaygroundOpacity] = useState(100);
  const { object, submit, isLoading, stop } = useObject({
    api: "/api/completion",
    schema: squiggleSchema,
  });

  useEffect(() => {
    if (object?.code) {
      setPlaygroundOpacity(100);
    }
  }, [object?.code]);

  const handleSubmit = () => {
    setPlaygroundOpacity(50);

    submit({ prompt, model: selectedModel.backendTitle });
    setPrompt("");
  };

  const handleStop = () => {
    stop();
    setPlaygroundOpacity(100);
  };

  return (
    <div className="flex h-screen">
      {/* Left column: Chat and Form */}
      <div className="flex w-1/4 flex-col p-4">
        <div className="mb-4">
          <select
            className="w-full rounded border p-2"
            value={selectedModel.backendTitle}
            onChange={(e) =>
              setSelectedModel(
                AVAILABLE_MODELS.find(
                  (m) => m.backendTitle === e.target.value
                ) || AVAILABLE_MODELS[0]
              )
            }
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.backendTitle} value={model.backendTitle}>
                {model.presentedTitle} ({model.company})
              </option>
            ))}
          </select>
        </div>
        <div className="flex">
          <textarea
            className="flex-grow rounded-l border p-2"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
          />
          <button
            className="rounded-r bg-blue-500 px-4 py-2 text-white"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Send"}
          </button>
        </div>
        {isLoading && (
          <button
            className="mt-2 rounded bg-red-500 px-4 py-2 text-white"
            onClick={handleStop}
          >
            Stop Generation
          </button>
        )}
      </div>

      {/* Right column: SquigglePlayground */}
      <div className="w-3/4 p-4" style={{ opacity: playgroundOpacity / 100 }}>
        <SquigglePlayground
          defaultCode={object?.code || "// Your Squiggle code will appear here"}
          key={object?.code}
          onNewSimulation={(e: any) => console.log("NEW SIMULATION", e)}
        />
      </div>
    </div>
  );
}
