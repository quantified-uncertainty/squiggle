import { AnyWorkerRunner } from "./AnyWorkerRunner.js";

export class WebWorkerRunner extends AnyWorkerRunner {
  constructor() {
    // This runner is browser-specific.
    if (typeof window === "undefined") {
      throw new Error("WebWorkerRunner is only available in browser");
    }
    super();
  }

  async getWorker(): Promise<Worker> {
    return new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
  }
}
