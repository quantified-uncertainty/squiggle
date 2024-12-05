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
     * In particular:
     * 1. ESM is problematic:`{ type: "module" }` (with `.mjs` or `.js`)will seemingly work, but cause lots of Turbopack CLI errors; Turbopack fails to analyze `(url, { type: "module" })` parameters correctly, as of Next.js 15.0.3.
     * 2. `.js` extension will collide with the default `"type": "module"` in `package.json`, which will lead to Next.js warnings.
     *
     * So, instead, we bundle the worker to the basic IIFE; see `package.json` for details.
     *
     * This might cause issues in the future, if we decide to depend on some library that's ESM-only; I'm not sure how good esbuild is for bundling ESM dependencies.
     *
     * But, for now, it seems like it's working.
     */

    // Note: the version below is configured to work for pre-turbopack next.js in dev and prod.
    this.worker = new Worker(new URL("./esbuild-worker.js", import.meta.url), {
      type: "module",
    });
  }

  async getWorker(): Promise<Worker> {
    return this.worker;
  }
}
