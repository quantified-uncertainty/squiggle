import { useCallback, useState } from "react";

import { ClientWorkflow, decodeWorkflowFromReader } from "@quri/squiggle-ai";

import { AiRequestBody, bodyToLineReader } from "./utils";

export function useSquiggleWorkflows(initialWorkflows: ClientWorkflow[]) {
  const [workflows, setWorkflows] =
    useState<ClientWorkflow[]>(initialWorkflows);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const updateWorkflow = useCallback(
    (id: string, update: (workflow: ClientWorkflow) => ClientWorkflow) => {
      setWorkflows((workflows) =>
        workflows.map((workflow) => {
          return workflow.id === id ? update(workflow) : workflow;
        })
      );
    },
    []
  );

  const addMockWorkflow = useCallback(
    (request: AiRequestBody) => {
      // This will be replaced with a real workflow once we receive the first message from the server.
      const id = `loading-${Date.now().toString()}`;
      const workflow: ClientWorkflow = {
        id,
        timestamp: new Date().getTime(),
        status: "loading",
        inputs: {
          prompt: {
            id: "prompt",
            kind: "prompt",
            value: request.kind === "create" ? request.prompt : "[FIX]",
          },
        },
        steps: [],
      };
      setWorkflows((workflows) => [...workflows, workflow]);
      setSelected(workflows.length); // select the new workflow
      return workflow;
    },
    [workflows.length]
  );

  const submitWorkflow = useCallback(
    async (request: AiRequestBody) => {
      // Add a mock workflow to show loading state while we wait for the server to respond.
      // It will be replaced by the real workflow once we receive the first message from the server.
      let id = addMockWorkflow(request).id;

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
          addWorkflow: async (workflow) => {
            // Replace the mock workflow with the real workflow.
            setWorkflows((workflows) =>
              workflows.map((w) => (w.id === id ? workflow : w))
            );
            id = workflow.id;
          },
          setWorkflow: async (update) => updateWorkflow(id, update),
        });
      } catch (error) {
        updateWorkflow(id, (workflow) => ({
          ...workflow,
          status: "error",
          result: `Server error: ${error instanceof Error ? error.toString() : "Unknown error"}.`,
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
