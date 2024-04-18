import { EmbeddedRunner } from "./EmbeddedRunner.js";
import { NodeWorkerRunner } from "./NodeWorkerRunner.js";

export { EmbeddedRunner, NodeWorkerRunner };

export function runnerByName(name: string) {
  switch (name) {
    case "node-worker":
      return new NodeWorkerRunner();
    case "embedded":
      return new EmbeddedRunner();
    default:
      throw new Error(`Unknown runner: ${name}`);
  }
}
