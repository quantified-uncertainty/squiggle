import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { runWithWorker } from "./NodeWorkerRunner.js";

export class WebWorkerRunner extends BaseRunner {
  constructor() {
    // This runner is browser-specific.
    if (typeof window === "undefined") {
      throw new Error("WebWorkerRunner is only available in browser");
    }
    super();
  }

  async run(params: RunParams): Promise<RunResult> {
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });

    return await runWithWorker(params, worker);
  }
}
