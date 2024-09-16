import { Reducer, useCallback, useReducer } from "react";

import {
  CreateRequestBody,
  SquiggleWorkflowResult,
  StepDescription,
  WorkflowDescription,
  workflowMessageSchema,
} from "./utils/squiggleTypes";

type State = {
  workflows: WorkflowDescription[];
  selected: number | undefined;
};

type StepDescriptionPatch = Partial<StepDescription> & { id: string };

type Action =
  | {
      type: "select";
      payload: string;
    }
  | {
      type: "add";
      payload: WorkflowDescription;
    }
  | {
      type: "finish";
      payload: {
        id: string;
        result: SquiggleWorkflowResult;
      };
    }
  | {
      type: "addStep";
      payload: {
        workflowId: string;
        step: StepDescriptionPatch &
          Pick<StepDescription, "id" | "name" | "inputs">;
      };
    }
  | {
      type: "updateStep";
      payload: {
        workflowId: string;
        step: StepDescriptionPatch;
      };
    }
  | {
      type: "error";
      payload: {
        id: string;
        error: string;
      };
    };

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "add":
      return {
        ...state,
        workflows: [...state.workflows, action.payload],
        selected: state.workflows.length,
      };
    case "finish":
      return {
        ...state,
        workflows: state.workflows.map((workflow) => {
          return workflow.id === action.payload.id
            ? {
                ...workflow,
                status: "finished",
                result: action.payload.result,
              }
            : workflow;
        }),
      };
    case "addStep":
      return {
        ...state,
        workflows: state.workflows.map((workflow) => {
          if (workflow.id === action.payload.workflowId) {
            return {
              ...workflow,
              currentStep: action.payload.step.name,
              steps: [
                ...workflow.steps,
                {
                  outputs: {},
                  messages: [],
                  state: "PENDING",
                  ...action.payload.step,
                },
              ],
            } satisfies WorkflowDescription;
          } else {
            return workflow;
          }
        }),
      };
    case "updateStep":
      return {
        ...state,
        workflows: state.workflows.map((workflow) => {
          if (workflow.id === action.payload.workflowId) {
            return {
              ...workflow,
              steps: workflow.steps.map((step) => {
                return step.id === action.payload.step.id
                  ? {
                      ...step,
                      ...action.payload.step,
                    }
                  : step;
              }),
            } satisfies WorkflowDescription;
          } else {
            return workflow;
          }
        }),
      };
    case "error":
      return {
        ...state,
        workflows: state.workflows.map((workflow) => {
          return workflow.id === action.payload.id
            ? {
                ...workflow,
                status: "error",
                result: action.payload.error,
              }
            : workflow;
        }),
      };
    case "select": {
      const index = state.workflows.findIndex(
        (workflow) => workflow.id === action.payload
      );
      return {
        ...state,
        selected: index === -1 ? undefined : index,
      };
    }
    default:
      return state;
  }
};

export function useSquiggleWorkflows() {
  const [state, dispatch] = useReducer(reducer, {
    workflows: [],
    selected: undefined,
  });

  const addWorkflow = useCallback((workflow: WorkflowDescription) => {}, []);

  const submitWorkflow = useCallback(async (request: CreateRequestBody) => {
    const id = Date.now().toString();
    dispatch({
      type: "add",
      payload: {
        id,
        request,
        status: "loading",
        timestamp: new Date(),
        steps: [],
      },
    });

    try {
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

      // Listen for events
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the JSON string
        const eventJson = JSON.parse(value);
        const event = workflowMessageSchema.parse(eventJson);

        switch (event.kind) {
          case "finalResult": {
            dispatch({
              type: "finish",
              payload: {
                id,
                result: event.content,
              },
            });
            break;
          }
          case "stepAdded":
            dispatch({
              type: "addStep",
              payload: {
                workflowId: id,
                step: event.content,
              },
            });
            break;
          case "stepUpdated":
            dispatch({
              type: "updateStep",
              payload: {
                workflowId: id,
                step: event.content,
              },
            });
            break;
        }
      }
    } catch (error) {
      dispatch({
        type: "error",
        payload: {
          id,
          error: `Error: ${error instanceof Error ? error.toString() : "Unknown error"}`,
        },
      });
    }
  }, []);

  const selectedWorkflow =
    state.selected === undefined ? undefined : state.workflows[state.selected];

  const selectWorkflow = useCallback((id: string) => {
    dispatch({
      type: "select",
      payload: id,
    });
  }, []);

  return {
    workflows: state.workflows,
    selectedWorkflow,
    submitWorkflow,
    selectWorkflow,
  };
}
