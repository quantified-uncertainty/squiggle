import { z } from "zod";

import { PromptArtifact, SourceArtifact } from "../Artifact.js";
import { adjustToFeedbackStep } from "../steps/adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "../steps/fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "../steps/generateCodeStep.js";
import { runAndFormatCodeStep } from "../steps/runAndFormatCodeStep.js";
import { squiggleWorkflowInputSchema } from "../types.js";
import { ControlledWorkflow } from "./ControlledWorkflow.js";
import { LlmConfig } from "./Workflow.js";

export type SquiggleWorkflowInput = z.infer<typeof squiggleWorkflowInputSchema>;

/**
 * This is a basic workflow for generating Squiggle code.
 *
 * It generates code based on a prompt, fixes it if necessary, and tries to
 * improve it based on feedback.
 */
export class SquiggleWorkflow extends ControlledWorkflow {
  public readonly input: SquiggleWorkflowInput;
  public readonly prompt: PromptArtifact;

  constructor(params: {
    input: SquiggleWorkflowInput;
    abortSignal?: AbortSignal;
    llmConfig?: LlmConfig;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) {
    super(params);

    this.input = params.input;
    this.prompt = new PromptArtifact(
      this.input.type === "Create" ? this.input.prompt : ""
    );
  }

  protected configureControllerLoop(): void {
    this.workflow.addEventListener("stepFinished", ({ data: { step } }) => {
      if (step.getState().kind !== "DONE") {
        return;
      }

      // output name is hardcoded, should we scan all outputs?
      const code = step.getOutputs()["code"];
      if (code?.kind !== "code") {
        return;
      }

      if (code.value.type === "success") {
        this.workflow.addStep(adjustToFeedbackStep, {
          prompt: this.prompt,
          code,
        });
      } else {
        this.workflow.addStep(fixCodeUntilItRunsStep, {
          code,
        });
      }
    });
  }

  protected configureInitialSteps(): void {
    if (this.input.type === "Create") {
      this.workflow.addStep(generateCodeStep, { prompt: this.prompt });
    } else {
      this.workflow.addStep(runAndFormatCodeStep, {
        source: new SourceArtifact(this.input.source),
      });
    }
  }
}
