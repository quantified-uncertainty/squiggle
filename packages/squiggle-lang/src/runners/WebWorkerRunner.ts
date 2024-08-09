import { AnyWorkerRunner } from "./AnyWorkerRunner.js";

export class WebWorkerRunner extends AnyWorkerRunner {
  worker: Worker;

  constructor() {
    // This runner is browser-specific.
    if (typeof window === "undefined") {
      throw new Error("WebWorkerRunner is only available in browser");
    }
    super();
    this.worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
  }

  async getWorker(): Promise<Worker> {
    return this.worker;
  }
}
