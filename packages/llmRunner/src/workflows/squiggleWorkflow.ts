import { ReadableStream } from "stream/web";

import { PromptArtifact, SourceArtifact } from "../Artifact.js";
import { generateSummary } from "../generateSummary.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { runAndFormatCodeStep } from "../steps/runAndFormatCodeStep.js";
import { serializeArtifact } from "../streaming.js";
import { SquiggleWorkflowMessage, SquiggleWorkflowResult } from "../types.js";
import {
  LlmConfig,
  Workflow,
  WorkflowEvent,
  WorkflowEventListener,
  WorkflowEventType,
} from "../Workflow.js";

export type SquiggleWorkflowInput =
  | { type: "Create"; prompt: string }
  | { type: "Edit"; source: string; prompt?: string };

type RunWorkflowParams = {
  input: SquiggleWorkflowInput;
  abortSignal?: AbortSignal;
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  handlers: Partial<{
    [K in WorkflowEventType]?: WorkflowEventListener<K>;
  }>;
};

function allStepsFinishedEventToFinalResult(
  event: WorkflowEvent<"allStepsFinished">,
  prompt: string
): SquiggleWorkflowResult {
  return {
    ...event.workflow.getFinalResult(),
    logSummary: generateSummary(prompt, event.workflow),
  };
}

// Run Squiggle workflow and stream the results through the handlers
export async function runSquiggleWorkflow(
  params: RunWorkflowParams
): Promise<void> {
  const { input } = params;

  const prompt = new PromptArtifact(
    input.type === "Create" ? input.prompt : ""
  );

  const workflow = new Workflow(
    params.llmConfig,
    params.openaiApiKey,
    params.anthropicApiKey
  );

  // Prepare event handlers
  for (const [eventType, listener] of Object.entries(params.handlers)) {
    if (eventType === "finishSquiggleWorkflow") {
      continue;
    }

    workflow.addEventListener(
      eventType as WorkflowEventType,
      listener as WorkflowEventListener<WorkflowEventType>
    );
  }

  // Controller loop - add steps based on the outputs of completed steps
  workflow.addEventListener("stepFinished", ({ data: { step } }) => {
    if (step.getState().kind !== "DONE") {
      return;
    }

    // output name is hardcoded, should we scan all outputs?
    const code = step.getOutputs()["code"];
    if (code?.kind !== "code") {
      return;
    }

    if (code.value.type === "success") {
      workflow.addStep(adjustToFeedbackStep, { prompt, code });
    } else {
      workflow.addStep(fixCodeUntilItRunsStep, { prompt, code });
    }
  });

  // Prepare and dispatch final result
  workflow.addEventListener("allStepsFinished", () => {});

  // Add the initial step
  if (input.type === "Create") {
    workflow.addStep(generateCodeStep, { prompt });
  } else {
    workflow.addStep(runAndFormatCodeStep, {
      source: new SourceArtifact(input.source),
    });
  }

  // Run
  await workflow.runUntilComplete();
}

// Run Squiggle workflow without streaming, only capture the final result
export async function runSquiggleWorkflowToResult(
  params: Omit<RunWorkflowParams, "handlers">
): Promise<SquiggleWorkflowResult> {
  let finalResult: SquiggleWorkflowResult | undefined;
  await runSquiggleWorkflow({
    ...params,
    handlers: {
      allStepsFinished: (event) => {
        // saveSummaryToFile(generateSummary(prompt, workflow));

        finalResult = allStepsFinishedEventToFinalResult(
          event,
          params.input.prompt ?? ""
        );
      },
    },
  });

  if (!finalResult) {
    throw new Error("No final result");
  }
  return finalResult;
}

export function runSquiggleWorkflowToStream(
  params: Omit<RunWorkflowParams, "handlers">
): ReadableStream<string> {
  const stream = new ReadableStream<string>({
    async pull(controller) {
      const send = (message: SquiggleWorkflowMessage) => {
        controller.enqueue(JSON.stringify(message) + "\n");
      };

      await runSquiggleWorkflow({
        ...params,
        handlers: {
          stepAdded: (event) => {
            send({
              kind: "stepAdded",
              content: {
                id: event.data.step.id,
                name: event.data.step.template.name ?? "unknown",
                inputs: Object.fromEntries(
                  Object.entries(event.data.step.getInputs()).map(
                    ([key, value]) => [key, serializeArtifact(value)]
                  )
                ),
              },
            });
          },
          stepFinished: (event) => {
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
          },
          allStepsFinished: (event) => {
            // saveSummaryToFile(generateSummary(prompt, workflow));

            send({
              kind: "finalResult",
              content: allStepsFinishedEventToFinalResult(
                event,
                params.input.prompt ?? ""
              ),
            });
          },
        },
      });
      controller.close();
    },
  });

  return stream;
}
