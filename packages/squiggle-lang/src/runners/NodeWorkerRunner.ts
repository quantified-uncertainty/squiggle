// import NodeWorker from "web-worker";
import { deserializeIError } from "../errors/IError.js";
import { squiggleCodec } from "../serialization/squiggle.js";
import { Err, Ok } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { SquiggleWorkerJob, SquiggleWorkerResponse } from "./worker.js";

function isNodeJs() {
  return Boolean(
    typeof process === "object" &&
      typeof process.versions === "object" &&
      process.versions.node
  );
}

type Worker = (typeof global)["Worker"]["prototype"];

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

export class NodeWorkerRunner extends BaseRunner {
  constructor() {
    // This runner is Node.js-specific. In theory,
    // https://www.npmjs.com/package/web-worker is universal, but it doesn't
    // play well with webpack.
    if (!isNodeJs()) {
      throw new Error("NodeWorkerRunner is only available in Node.js");
    }
    super();
  }

  async run(params: RunParams): Promise<RunResult> {
    throw new Error("disabled");
    //   const workerUrl = new URL("./worker.js", import.meta.url);

    //   // web-worker module types are broken, so we use browser types instead
    //   const worker = new (NodeWorker as any)(workerUrl, {
    //     type: "module",
    //   }) as Worker;

    //   return await runWithWorker(params, worker);
  }
}
