import { useCallback, useState } from "react";

import {
  decodeWorkflowFromReader,
  SerializedWorkflow,
  SquiggleWorkflowInput,
} from "@quri/squiggle-ai";

import { bodyToLineReader, CreateRequestBody, requestToInput } from "./utils";

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

  const addMockWorkflow = useCallback(
    (input: SquiggleWorkflowInput) => {
      const id = `loading-${Date.now().toString()}`;
      const workflow: SerializedWorkflow = {
        id,
        timestamp: new Date(),
        status: "loading",
        input,
        steps: [],
      };
      setWorkflows((workflows) => [...workflows, workflow]);
      setSelected(workflows.length); // select the new workflow
      return workflow;
    },
    [workflows.length]
  );

  const submitWorkflow = useCallback(
    async (request: CreateRequestBody) => {
      const input = requestToInput(request);

      // Add a mock workflow to show loading state while we wait for the server to respond.
      // It will be replaced by the real workflow once we receive the first message from the server.
      let id = addMockWorkflow(requestToInput(request)).id;

      try {
        const response = await fetch("/ai/api/create", {
          method: "POST",
          body: JSON.stringify(request),
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = bodyToLineReader(
          response.body.pipeThrough(new TextDecoderStream())
        );

        await decodeWorkflowFromReader({
          reader: reader as ReadableStreamDefaultReader, // frontend types don't precisely match Node.js types
          input: requestToInput(request),
          addWorkflow: (workflow) => {
            // Replace the mock workflow with the real workflow.
            setWorkflows((workflows) =>
              workflows.map((w) => (w.id === id ? workflow : w))
            );
            id = workflow.id;
          },
          setWorkflow: (update) => updateWorkflow(id, update),
        });
      } catch (error) {
        updateWorkflow(id, (workflow) => ({
          ...workflow,
          status: "error",
          result: `Error: ${error instanceof Error ? error.toString() : "Unknown error"}`,
        }));
      }
    },
    [updateWorkflow, addMockWorkflow]
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
