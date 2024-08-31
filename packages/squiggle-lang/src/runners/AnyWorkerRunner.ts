import { squiggleCodec } from "../serialization/squiggle.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { deserializeRunResult } from "./serialization.js";
import { SquiggleWorkerJob, SquiggleWorkerResponse } from "./worker.js";

export async function runWithWorker(
  { module, environment, imports }: RunParams,
  worker: Worker
): Promise<RunResult> {
  const serializedImports: SquiggleWorkerJob["imports"] = {};
  const store = squiggleCodec.makeSerializer();
  for (const [path, value] of Object.entries(imports)) {
    const entrypoint = store.serialize("value", value);
    serializedImports[path] = entrypoint;
  }
  const bundle = store.getBundle();

  worker.postMessage({
    module: {
      name: module.name,
      code: module.code,
    },
    environment,
    bundle,
    imports: serializedImports,
  } satisfies SquiggleWorkerJob);

  return new Promise<RunResult>((resolve, reject) => {
    worker.addEventListener(
      "message",
      (e: MessageEvent<SquiggleWorkerResponse>) => {
        if (e.data.type === "internal-error") {
          reject(new Error(`Internal worker error: ${e.data.payload}`));
          return;
        }
        if (e.data.type !== "result") {
          reject(
            new Error(
              `Unexpected message ${JSON.stringify(e.data)} from worker`
            )
          );
          return;
        }
        const { payload } = e.data;

        resolve(deserializeRunResult(payload));
      }
    );
  });
}

export abstract class AnyWorkerRunner extends BaseRunner {
  async run(params: RunParams): Promise<RunResult> {
    const worker = await this.getWorker();

    return await runWithWorker(params, worker);
  }

  abstract getWorker(): Promise<Worker>;
}
