import { EmbeddedRunner } from "./EmbeddedRunner.js";
import { EmbeddedWithSerializationRunner } from "./EmbeddedWithSerializationRunner.js";
import { WorkerRunner } from "./WorkerRunner.js";

export { EmbeddedRunner, WorkerRunner };

export const allRunnerNames = [
  "node-worker",
  "embedded",
  "embedded-with-serialization",
] as const;

export type RunnerName = (typeof allRunnerNames)[number];

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

export const defaultRunnerName = "embedded" as const satisfies RunnerName;

export function getDefaultRunner() {
  // `process` can be undefined in Storybook environment; @types/node in squiggle-lang is a lie.
  const envRunner =
    typeof process === "undefined"
      ? undefined
      : process.env["SQUIGGLE_DEFAULT_RUNNER"];
  const defaultRunner = envRunner ?? defaultRunnerName;

  if (!(allRunnerNames as readonly string[]).includes(defaultRunner)) {
    throw new Error("Unknown runner: " + defaultRunner);
  }
  return runnerByName(defaultRunner as RunnerName);
}
