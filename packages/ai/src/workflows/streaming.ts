import {
  type ReadableStreamController,
  type ReadableStreamDefaultReader,
} from "stream/web";

import { Artifact } from "../Artifact.js";
import {
  ClientArtifact,
  ClientWorkflow,
  StreamingMessage,
  streamingMessageSchema,
} from "../types.js";
import { type SquiggleWorkflowInput } from "./SquiggleWorkflow.js";
import { Workflow } from "./Workflow.js";

export function serializeArtifact(value: Artifact): ClientArtifact {
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
  const send = (message: StreamingMessage) => {
    controller.enqueue(JSON.stringify(message) + "\n");
  };

  workflow.addEventListener("workflowStarted", (event) => {
    send({
      kind: "workflowStarted",
      content: {
        id: event.workflow.id,
        timestamp: event.workflow.startTime,
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
export async function decodeWorkflowFromReader({
  reader,
  input,
  addWorkflow,
  setWorkflow,
}: {
  reader: ReadableStreamDefaultReader<string>;
  // FIXME - this shouldn't be necessary, but we need to inject the input to
  // SerializedWorkflow, and it's not stored on the original Workflow yet, so
  // it's not present in the stream data.
  // In the future, we should store input parameters in the Workflow object.
  input: SquiggleWorkflowInput;
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
    const event = streamingMessageSchema.parse(eventJson);

    switch (event.kind) {
      case "workflowStarted": {
        await addWorkflow({
          id: event.content.id,
          timestamp: event.content.timestamp,
          input,
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
              outputs: {},
              messages: [],
              state: "PENDING",
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
