import {
  type ReadableStreamController,
  type ReadableStreamDefaultReader,
} from "stream/web";

import { Artifact } from "../Artifact.js";
import {
  SerializedArtifact,
  SerializedWorkflow,
  WorkflowMessage,
  workflowMessageSchema,
} from "../types.js";
import { Workflow } from "./Workflow.js";

export function serializeArtifact(value: Artifact): SerializedArtifact {
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

/**
 * Add listeners to a workflow to stream the results as a ReadableStream.
 *
 * Results are streamed as JSON-encoded lines.
 *
 * `ControlledWorkflow.runAsStream()` relies on this function; see its
 * implementation for more details.
 */
export function addStreamingListeners(
  workflow: Workflow,
  controller: ReadableStreamController<string>
) {
  const send = (message: WorkflowMessage) => {
    controller.enqueue(JSON.stringify(message) + "\n");
  };

  workflow.addEventListener("stepAdded", (event) => {
    send({
      kind: "stepAdded",
      content: {
        id: event.data.step.id,
        name: event.data.step.template.name ?? "unknown",
        inputs: Object.fromEntries(
          Object.entries(event.data.step.getInputs()).map(([key, value]) => [
            key,
            serializeArtifact(value),
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
        state: event.data.step.getState().kind,
        outputs: Object.fromEntries(
          Object.entries(event.data.step.getOutputs())
            .filter(
              (pair): pair is [string, NonNullable<(typeof pair)[1]>] =>
                pair[1] !== undefined
            )
            .map(([key, value]) => [key, serializeArtifact(value)])
        ),
        messages: event.data.step.getConversationMessages(),
      },
    });
  });
  workflow.addEventListener("allStepsFinished", (event) => {
    // saveSummaryToFile(generateSummary(prompt, workflow));

    send({
      kind: "finalResult",
      content: event.workflow.getFinalResult(),
    });
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
export async function decodeWorkflowFromReader(
  reader: ReadableStreamDefaultReader<string>,
  // This matches the functional version of `useState` state setter.
  setWorkflow: (
    cb: (workflow: SerializedWorkflow) => SerializedWorkflow
  ) => void
) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Parse the JSON string
    const eventJson = JSON.parse(value);
    const event = workflowMessageSchema.parse(eventJson);

    switch (event.kind) {
      case "finalResult": {
        setWorkflow((workflow) => ({
          ...workflow,
          status: "finished",
          result: event.content,
        }));
        break;
      }
      case "stepAdded":
        setWorkflow((workflow) => ({
          ...workflow,
          currentStep: event.content.name,
          steps: [
            ...workflow.steps,
            {
              outputs: {},
              messages: [],
              state: "PENDING",
              ...event.content,
            },
          ],
        }));
        break;
      case "stepUpdated":
        setWorkflow((workflow) => ({
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
