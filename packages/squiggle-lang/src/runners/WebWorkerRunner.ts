import { deserializeIError } from "../errors/IError.js";
import { squiggleCodec } from "../serialization/squiggle.js";
import { Err, Ok } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { SquiggleWorkerJob, SquiggleWorkerResponse } from "./worker.js";

export async function runWithWorker(
  { environment, ast, sourceId, externals }: RunParams,
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
    sourceId,
  } satisfies SquiggleWorkerJob);

  return new Promise<RunResult>((resolve) => {
    worker.addEventListener("message", (e: any) => {
      const data: SquiggleWorkerResponse = e.data;
      if (data.type === "internal-error") {
        throw new Error(`Internal worker error: ${data.payload}`);
      }
      if (data.type !== "result") {
        throw new Error(
          `Unexpected message ${JSON.stringify(data)} from worker`
        );
      }

      worker.terminate();
      if (data.payload.ok) {
        const deserializer = squiggleCodec.makeDeserializer(
          data.payload.value.bundle
        );

        const result = deserializer.deserialize(data.payload.value.result);
        const bindings = deserializer.deserialize(data.payload.value.bindings);
        const exports = deserializer.deserialize(data.payload.value.exports);

        if (!(bindings instanceof VDict)) {
          throw new Error("Expected VDict for bindings");
        }
        if (!(exports instanceof VDict)) {
          throw new Error("Expected VDict for exports");
        }

        resolve(Ok({ result, bindings, exports, externals }));
      } else {
        const error = deserializeIError(data.payload.value);
        resolve(Err(error));
      }
    });
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
