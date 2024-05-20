import { squiggleCodec } from "../serialization/squiggle.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { deserializeRunResult } from "./serialization.js";
import { SquiggleWorkerJob, SquiggleWorkerResponse } from "./worker.js";

export async function runWithWorker(
  { environment, ast, externals }: RunParams,
  worker: Worker
): Promise<RunResult> {
  const store = squiggleCodec.makeSerializer();
  const externalsEntrypoint = store.serialize("value", externals);
  const bundle = store.getBundle();

  worker.postMessage({
    environment,
    ast,
    bundle,
    externalsEntrypoint,
  } satisfies SquiggleWorkerJob);

  return new Promise<RunResult>((resolve) => {
    worker.addEventListener(
      "message",
      (e: MessageEvent<SquiggleWorkerResponse>) => {
        if (e.data.type === "internal-error") {
          throw new Error(`Internal worker error: ${e.data.payload}`);
        }
        if (e.data.type !== "result") {
          throw new Error(
            `Unexpected message ${JSON.stringify(e.data)} from worker`
          );
        }
        const { payload } = e.data;

        worker.terminate();
        resolve(deserializeRunResult(payload));
      }
    );
  });
}

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
