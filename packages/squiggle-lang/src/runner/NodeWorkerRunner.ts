import { SquiggleWorkerResponse } from "../public/SqProject/worker.js";
import { Ok } from "../utility/result.js";
import { deserializeValue, serializeValue } from "../value/serialize.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";

export class NodeWorkerRunner extends BaseRunner {
  async run({
    environment,
    ast,
    externals,
    sourceId,
  }: RunParams): Promise<RunResult> {
    const workerUrl = new URL("./worker.js", import.meta.url);
    const worker = new (Worker as any)(workerUrl, { type: "module" });

    worker.postMessage({
      environment,
      ast,
      externals: serializeValue(externals),
      sourceId,
    });

    return new Promise<RunResult>((resolve) => {
      worker.addEventListener("message", (e: any) => {
        const data: SquiggleWorkerResponse = e.data;
        if (data.type !== "result")
          throw new Error("Expected result message from worker");

        worker.terminate();
        if (data.payload.ok) {
          resolve(
            Ok({
              result: deserializeValue(data.payload.value.result),
              bindings: deserializeValue(data.payload.value.bindings) as VDict,
              exports: deserializeValue(data.payload.value.exports) as VDict,
              externals,
            })
          );
        } else {
          throw new Error("TODO");
          // deserialize error and resolve(Err(...))
        }
      });
    });
  }
}
