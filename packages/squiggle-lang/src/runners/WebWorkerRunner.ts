import { AnyWorkerRunner } from "./AnyWorkerRunner.js";

export class WebWorkerRunner extends AnyWorkerRunner {
  worker: Worker;

  constructor() {
    // This runner is browser-specific.
    if (typeof window === "undefined") {
      throw new Error("WebWorkerRunner is only available in browser");
    }
    super();

    /**
     * If you need to touch this code, make sure to check carefully both the components (storybook) and the hub editor.
     * This configuration and the esbuild configuration in `package.json` are extremely fragile.
     *
     * Details here: https://github.com/quantified-uncertainty/squiggle/pull/3456
     */
    this.worker = new Worker(new URL("./esbuild-worker.js", import.meta.url), {
      type: "module",
    });
  }

  async getWorker(): Promise<Worker> {
    return this.worker;
  }
}
