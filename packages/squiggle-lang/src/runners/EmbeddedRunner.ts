import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { baseRun } from "./common.js";

export class EmbeddedRunner extends BaseRunner {
  async run(params: RunParams): Promise<RunResult> {
    if (typeof MessageChannel === "undefined") {
      // fallback for Node.js environment and older browsers
      return baseRun(params);
    } else {
      // `baseRun` is not truly async, but we want to run it in the next tick in the browser, so that the UI can update first.
      // trick from https://stackoverflow.com/a/56727837
      return new Promise<RunResult>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = async () => resolve(baseRun(params));

        requestAnimationFrame(() => channel.port2.postMessage(undefined));
      });
    }
  }
}
