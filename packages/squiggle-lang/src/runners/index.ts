import { EmbeddedRunner } from "./EmbeddedRunner.js";
import { EmbeddedWithSerializationRunner } from "./EmbeddedWithSerializationRunner.js";
import { WorkerRunner } from "./WorkerRunner.js";

export { EmbeddedRunner, WorkerRunner };

export const allRunnerNames = [
  "node-worker",
  "embedded",
  "embedded-with-serialization",
] as const;

type RunnerName = (typeof allRunnerNames)[number];

export function runnerByName(name: RunnerName) {
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

const DEFAULT_RUNNER: RunnerName = "embedded";

export function getDefaultRunner() {
  const defaultRunner =
    process.env["SQUIGGLE_DEFAULT_RUNNER"] ?? DEFAULT_RUNNER;

  if (!(allRunnerNames as readonly string[]).includes(defaultRunner)) {
    throw new Error("Unknown runner: " + defaultRunner);
  }
  return runnerByName(defaultRunner as RunnerName);
}
