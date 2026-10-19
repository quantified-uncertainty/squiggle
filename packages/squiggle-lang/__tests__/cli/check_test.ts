import * as path from "path";
import * as url from "url";

import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const fixturesDir = path.join(__dirname, "..", "fixtures");

describe("check command", () => {
  test("valid code", async () => {
    const result = await runCLI(["check", "-e", "x = 1\nx + 1"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(stripAnsi(result.stdout)).toMatch(/OK: no errors/);
  });

  test("does not run code by default", async () => {
    const result = await runCLI(["check", "-e", "List.first([])"]);
    expect(result.exitCode).toBe(0);
  });

  test("--run reports runtime errors", async () => {
    const result = await runCLI([
      "check",
      "--json",
      "--run",
      "-e",
      "List.first([])",
    ]);
    expect(result.exitCode).toBe(1);
    const json = JSON.parse(result.stdout);
    expect(json.ran).toBe(true);
    expect(json.errors[0].kind).toBe("runtime");
  });

  test("type error", async () => {
    const result = await runCLI(["check", "--json", "-e", 'x = 1 + "a"']);
    expect(result.exitCode).toBe(1);
    const json = JSON.parse(result.stdout);
    expect(json.ok).toBe(false);
    expect(json.errors[0]).toMatchObject({
      kind: "compile",
      location: { start: { line: 1 } },
    });
    expect(json.errors[0].message).toMatch(/Operator '\+'/);
  });

  test("text output with hints", async () => {
    const result = await runCLI(["check", "-e", "x = 5\nx += 3"]);
    expect(result.exitCode).toBe(1);
    const stderr = stripAnsi(result.stderr);
    expect(stderr).toMatch(/Compile Error:/);
    expect(stderr).toMatch(/Hint: Variables are immutable/);
  });

  test("checks imports and reports missing ones", async () => {
    const filename = path.join(fixturesDir, "check-errors", "main.squiggle");
    const result = await runCLI(["check", "--json", filename]);
    expect(result.exitCode).toBe(1);
    const json = JSON.parse(result.stdout);
    expect(json.files).toHaveLength(2);
    const messages = json.errors.map((e: { message: string }) => e.message);
    expect(messages).toContain("List.sum is not defined");
    expect(messages.some((m: string) => /missing\.squiggle/.test(m))).toBe(
      true
    );
    const libError = json.errors.find(
      (e: { message: string }) => e.message === "List.sum is not defined"
    );
    expect(libError.location.file).toMatch(/lib\.squiggle$/);
  });

  test("warnings", async () => {
    const result = await runCLI(["check", "--json", "-e", "X = 1\nx = 2"]);
    const json = JSON.parse(result.stdout);
    expect(json.warnings.length).toBeGreaterThan(0);
  });

  test("--no-warnings", async () => {
    const result = await runCLI([
      "check",
      "--json",
      "--no-warnings",
      "-e",
      "y = null",
    ]);
    expect(JSON.parse(result.stdout).warnings).toEqual([]);
  });
});
