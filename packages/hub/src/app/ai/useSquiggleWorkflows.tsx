import { useCallback, useState } from "react";

import {
  decodeWorkflowFromReader,
  SerializedWorkflow,
} from "@quri/squiggle-ai";

import { CreateRequestBody, requestToInput } from "./utils";

// Convert a ReadableStream (`response.body` from `fetch()`) to a line-by-line reader.
function bodyToLineReader(stream: ReadableStream<Uint8Array>) {
  let buffer = "";
  return stream
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
}

export function useSquiggleWorkflows() {
  const [workflows, setWorkflows] = useState<SerializedWorkflow[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const updateWorkflow = useCallback(
    (
      id: string,
      update: (workflow: SerializedWorkflow) => SerializedWorkflow
    ) => {
      setWorkflows((workflows) =>
        workflows.map((workflow) => {
          return workflow.id === id ? update(workflow) : workflow;
        })
      );
    },
    []
  );

  const submitWorkflow = useCallback(
    async (request: CreateRequestBody) => {
      const id = Date.now().toString();
      setWorkflows((workflows) => [
        ...workflows,
        {
          id,
          input: requestToInput(request),
          status: "loading",
          timestamp: new Date(),
          steps: [],
        },
      ]);
      setSelected(workflows.length - 1);

      try {
        const response = await fetch("/ai/api/create", {
          method: "POST",
          body: JSON.stringify(request),
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = bodyToLineReader(response.body);

        await decodeWorkflowFromReader(
          reader as ReadableStreamDefaultReader, // frontend types don't precisely match Node.js types
          (update) => updateWorkflow(id, update)
        );
      } catch (error) {
        updateWorkflow(id, (workflow) => ({
          ...workflow,
          status: "error",
          result: `Error: ${error instanceof Error ? error.toString() : "Unknown error"}`,
        }));
      }
    },
    [updateWorkflow, workflows.length]
  );

  const selectedWorkflow =
    selected === undefined ? undefined : workflows[selected];

  const selectWorkflow = useCallback(
    (id: string) => {
      const index = workflows.findIndex((workflow) => workflow.id === id);
      setSelected(index === -1 ? undefined : index);
    },
    [workflows]
  );

  return {
    workflows,
    selectedWorkflow,
    submitWorkflow,
    selectWorkflow,
  };
}
