import * as path from "path";
import * as url from "url";

import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const fixturesDir = path.join(__dirname, "..", "fixtures");

test("Eval", async () => {
  const result = await runCLI(["run", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("4\n");
});

test("Quiet", async () => {
  const result = await runCLI(["run", "--eval", "2+2", "--quiet"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("");
});

test("Time", async () => {
  const result = await runCLI(["run", "--time", "--eval", "2+2"]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toMatch(/4\n\nTime: 0(\.\d+)?s\n/);
});

test("Bindings", async () => {
  const result = await runCLI([
    "run",
    "--eval",
    "x = 5; x + 1",
    "--show-bindings",
  ]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(stripAnsi(result.stdout)).toBe("Result:\n6\n\nBindings:\n{x: 5}\n");
});

test("Code with imports", async () => {
  const filename = path.join(fixturesDir, "imports", "main.squiggle");
  const result = await runCLI(["run", filename]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("Normal(5,2)\n");
});

test("Relative imports", async () => {
  const filename = path.join(fixturesDir, "relative-imports", "main.squiggle");
  const result = await runCLI(["run", filename]);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("113\n");
});
