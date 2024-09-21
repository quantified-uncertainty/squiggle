import { ReadableStream } from "stream/web";

import { WorkflowResult } from "../types.js";
import { addStreamingListeners } from "./streaming.js";
import { LlmConfig, Workflow } from "./Workflow.js";

/**
 * This is a base class for other, specific workflows.
 *
 * It assumes that the `Workflow` is controlled by injecting new steps based on
 * workflow events.
 *
 * Specific workflows should override `configureControllerLoop` and
 * `configureInitialSteps` to set up the workflow. They should also commonly
 * override the constructor to capture the parameters.
 *
 * Note: it might be good to avoid inheritance and go with function composition,
 * but `runAsStream` implementation and the way it interacts with the underlying
 * `Workflow` through events makes it tricky. If you can think of a better way,
 * please refactor!
 */
export abstract class ControlledWorkflow {
  public workflow: Workflow;
  private started: boolean = false;

  constructor(params: {
    abortSignal?: AbortSignal;
    llmConfig?: LlmConfig;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) {
    this.workflow = new Workflow(
      params.llmConfig,
      params.openaiApiKey,
      params.anthropicApiKey
    );
  }

  protected abstract configureControllerLoop(): void;

  protected abstract configureInitialSteps(): void;

  private startOrThrow() {
    if (this.started) {
      throw new Error("Workflow already started");
    }
    this.started = true;
  }

  private configure() {
    this.configureControllerLoop();
    this.configureInitialSteps();
  }

  // Run workflow to the ReadableStream, appropriate for streaming in Next.js routes
  runAsStream(): ReadableStream<string> {
    this.startOrThrow();

    const stream = new ReadableStream<string>({
      start: async (controller) => {
        addStreamingListeners(this.workflow, controller);

        this.workflow.prepareToStart();

        // Important! `configure` should be called after all event listeners are set up.
        // We want to capture `stepAdded` events.
        this.configure();

        await this.workflow.runUntilComplete();
        controller.close();
      },
    });

    return stream;
  }

  // Run workflow without streaming, only capture the final result
  async runToResult(): Promise<WorkflowResult> {
    this.startOrThrow();
    this.configure();

    await this.workflow.runUntilComplete();

    // saveSummaryToFile(generateSummary(workflow));
    return this.workflow.getFinalResult();
  }
}
