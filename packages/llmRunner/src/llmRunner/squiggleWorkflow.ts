import { SquiggleWorkflowResult } from "../app/utils/squiggleTypes";
import { PromptArtifact, SourceArtifact } from "./Artifact";
import { generateSummary } from "./generateSummary";
import { adjustToFeedbackStep } from "./steps/adjustToFeedbackStep";
import { fixCodeUntilItRunsStep } from "./steps/fixCodeUntilItRunsStep";
import { generateCodeStep } from "./steps/generateCodeStep";
import { runAndFormatCodeStep } from "./steps/runAndFormatCodeStep";
import {
  LlmConfig,
  Workflow,
  WorkflowEventListener,
  WorkflowEventType,
} from "./Workflow";

export type SquiggleWorkflowInput =
  | { type: "Create"; prompt: string }
  | { type: "Edit"; source: string };

type SquiggleEventHandlers = Partial<{
  [K in WorkflowEventType]?: WorkflowEventListener<K>;
}> & {
  // fake squiggle-specific event
  finishSquiggleWorkflow: (event: {
    data: { result: SquiggleWorkflowResult };
  }) => void;
};

type RunWorkflowParams = {
  input: SquiggleWorkflowInput;
  abortSignal?: AbortSignal;
  llmConfig?: LlmConfig;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  handlers: SquiggleEventHandlers;
};

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

  // Controller - add steps based on the outputs of completed steps
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
  workflow.addEventListener("allStepsFinished", () => {
    // saveSummaryToFile(generateSummary(prompt, workflow));

    const logSummary = generateSummary(prompt.value, workflow);

    params.handlers.finishSquiggleWorkflow?.({
      data: {
        result: {
          ...workflow.getFinalResult(),
          logSummary,
        },
      },
    });
  });

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
      finishSquiggleWorkflow: (event) => {
        finalResult = event.data.result;
      },
    },
  });

  if (!finalResult) {
    throw new Error("No final result");
  }
  return finalResult;
}
