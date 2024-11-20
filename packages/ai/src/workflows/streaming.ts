import {
  type ReadableStreamController,
  type ReadableStreamDefaultReader,
} from "stream/web";

import { Artifact } from "../Artifact.js";
import { type LLMStepInstance } from "../LLMStepInstance.js";
import { IOShape, StepState } from "../LLMStepTemplate.js";
import {
  ClientArtifact,
  ClientStep,
  ClientWorkflow,
  StreamingMessage,
  streamingMessageSchema,
} from "../types.js";
import { type Workflow } from "./Workflow.js";

export function artifactToClientArtifact(value: Artifact): ClientArtifact {
  const commonArtifactFields = {
    id: value.id,
    createdBy: value.createdBy?.id,
  };
  switch (value.kind) {
    case "source":
      return {
        ...commonArtifactFields,
        kind: "source",
        value: value.value,
      };
    case "code":
      return {
        ...commonArtifactFields,
        kind: "code",
        value: value.value.source,
        ok: value.value.type === "success",
      };
    case "prompt":
      return {
        ...commonArtifactFields,
        kind: "prompt",
        value: value.value,
      };
    default:
      throw new Error(`Unknown artifact ${value satisfies never}`);
  }
}

function getClientState<Shape extends IOShape>(
  state: StepState<Shape>
): ClientStep["state"] {
  if (state.kind === "DONE") {
    return {
      kind: "DONE",
      outputs: Object.fromEntries(
        Object.entries(state.outputs)
          .filter(
            (pair): pair is [string, NonNullable<(typeof pair)[1]>] =>
              pair[1] !== undefined
          )
          .map(([key, value]) => [key, artifactToClientArtifact(value)])
      ),
    };
  } else {
    return state;
  }
}

export function stepToClientStep(step: LLMStepInstance): ClientStep {
  return {
    id: step.id,
    name: step.template.name ?? "unknown",
    state: getClientState(step.getState()),
    inputs: Object.fromEntries(
      Object.entries(step.getInputs()).map(([key, value]) => [
        key,
        artifactToClientArtifact(value),
      ])
    ),
    messages: step.getConversationMessages(),
  };
}

/**
 * Add listeners to a workflow to stream the results as a ReadableStream.
 *
 * Results are streamed as JSON-encoded lines.
 *
 * `Workflow.runAsStream()` relies on this function; see its
 * implementation for more details.
 */
export function addStreamingListeners<Shape extends IOShape>(
  workflow: Workflow<Shape>,
  controller: ReadableStreamController<string>
) {
  const send = (message: StreamingMessage) => {
    controller.enqueue(JSON.stringify(message) + "\n");
  };

  workflow.addEventListener("workflowStarted", (event) => {
    send({
      kind: "workflowStarted",
      content: {
        id: event.workflow.id,
        timestamp: event.workflow.startTime,
        inputs: Object.fromEntries(
          Object.entries(event.workflow.inputs).map(([key, value]) => [
            key,
            artifactToClientArtifact(value),
          ])
        ),
      },
    });
  });

  workflow.addEventListener("stepAdded", (event) => {
    send({
      kind: "stepAdded",
      content: {
        id: event.data.step.id,
        name: event.data.step.template.name ?? "unknown",
        inputs: Object.fromEntries(
          Object.entries(event.data.step.getInputs()).map(([key, value]) => [
            key,
            artifactToClientArtifact(value),
          ])
        ),
      },
    });
  });
  workflow.addEventListener("stepFinished", (event) => {
    send({
      kind: "stepUpdated",
      content: {
        id: event.data.step.id,
        state: getClientState(event.data.step.getState()),
        messages: event.data.step.getConversationMessages(),
      },
    });
  });
  workflow.addEventListener("allStepsFinished", (event) => {
    send({
      kind: "finalResult",
      content: event.workflow.getFinalResult(),
    });
    controller.close();
  });
}

/**
 * Decode the stream and incrementally update the client-side workflow object.
 *
 * This function is used in the frontend; see `useSquiggleWorkflows` hook for
 * more details.
 *
 * Note: we pass the reader object here instead of the stream itself, because
 * this function is used in the frontend; so we can't import "stream/web" here.
 */
export async function decodeWorkflowFromReader({
  reader,
  addWorkflow,
  setWorkflow,
}: {
  reader: ReadableStreamDefaultReader<string>;
  // This adds an initial version of the workflow.
  addWorkflow: (workflow: ClientWorkflow) => Promise<void>;
  // This signature might look complicated, but it matches the functional
  // version of `useState` state setter.
  setWorkflow: (
    cb: (workflow: ClientWorkflow) => ClientWorkflow
  ) => Promise<void>;
}) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Parse the JSON string
    const eventJson = JSON.parse(value);

    // Note that these are streaming events.
    // They are easy to confuse with workflow events.
    // The difference is that streaming events are sent over the wire, and so they contain JSON data.
    // Workflow events are internal to the server and so they contain non-JSON data (such as LLMStepInstance references).
    const event = streamingMessageSchema.parse(eventJson);

    switch (event.kind) {
      case "workflowStarted": {
        await addWorkflow({
          id: event.content.id,
          timestamp: event.content.timestamp,
          inputs: event.content.inputs,
          steps: [],
          status: "loading",
        });
        break;
      }
      case "finalResult": {
        await setWorkflow((workflow) => ({
          ...workflow,
          status: "finished",
          result: event.content,
        }));
        break;
      }
      case "stepAdded":
        await setWorkflow((workflow) => ({
          ...workflow,
          currentStep: event.content.name,
          steps: [
            ...workflow.steps,
            {
              messages: [],
              state: { kind: "PENDING" },
              ...event.content,
            },
          ],
        }));
        break;
      case "stepUpdated":
        await setWorkflow((workflow) => ({
          ...workflow,
          steps: workflow.steps.map((step) => {
            return step.id === event.content.id
              ? {
                  ...step,
                  ...event.content,
                }
              : step;
          }),
        }));
        break;
    }
  }
}
