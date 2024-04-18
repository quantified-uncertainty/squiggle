import { EmbeddedRunner } from "./EmbeddedRunner.js";
import { EmbeddedWithSerializationRunner } from "./EmbeddedWithSerializationRunner.js";
import { WorkerRunner } from "./WorkerRunner.js";

export { EmbeddedRunner, WorkerRunner };

export function runnerByName(name: string) {
  switch (name) {
    case "node-worker":
      return new WorkerRunner();
    case "embedded":
      return new EmbeddedRunner();
    case "embedded-with-serialization":
      return new EmbeddedWithSerializationRunner();
    default:
      throw new Error(`Unknown runner: ${name}`);
  }
}
