import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { deserializeRunResult, serializeRunResult } from "./common.js";
import { EmbeddedRunner } from "./EmbeddedRunner.js";

/**
 * This runner is useful for testing serialization and deserialization.
 *
 *  It uses the EmbeddedRunner to run the code, and then serializes and
 *  deserializes the result before returning it.
 */
export class EmbeddedWithSerializationRunner extends BaseRunner {
  wrappedRunner = new EmbeddedRunner();

  async run(params: RunParams): Promise<RunResult> {
    const result = await this.wrappedRunner.run(params);

    const serialized = serializeRunResult(result);

    if (
      // @types/node is a lie, process.env fails in Vite environment
      typeof process !== "undefined" &&
      process.env["PRINT_SERIALIZED_BUNDLE"]
    ) {
      console.log(JSON.stringify(serialized, null, 2));
    }

    return deserializeRunResult(serialized);
  }
}
