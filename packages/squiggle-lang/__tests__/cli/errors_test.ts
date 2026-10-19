import { runCLI, stripAnsi } from "../helpers/cliHelpers.js";

describe("run command error handling", () => {
  test("parse error exits with code 1", async () => {
    const result = await runCLI(["run", "--eval", "2+"]);
    expect(result.exitCode).toBe(1);
  });

  test("parse error outputs to stderr", async () => {
    const result = await runCLI(["run", "--eval", "2+"]);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toBe("");
  });

  test("parse error shows 'Compile Error' header", async () => {
    const result = await runCLI(["run", "--eval", "2+"]);
    expect(stripAnsi(result.stderr)).toMatch(/Compile Error:/);
  });

  test("undefined variable shows 'Compile Error' header", async () => {
    const result = await runCLI(["run", "--eval", "undefinedVar"]);
    expect(result.exitCode).toBe(1);
    expect(stripAnsi(result.stderr)).toMatch(/Compile Error:/);
    expect(stripAnsi(result.stderr)).toMatch(/not defined/);
  });

  test("runtime error exits with code 1", async () => {
    const result = await runCLI(["run", "--eval", "List.first([])"]);
    expect(result.exitCode).toBe(1);
  });

  test("runtime error outputs to stderr", async () => {
    const result = await runCLI(["run", "--eval", "List.first([])"]);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toBe("");
  });

  test("runtime error shows 'Runtime Error' header", async () => {
    const result = await runCLI(["run", "--eval", "List.first([])"]);
    expect(stripAnsi(result.stderr)).toMatch(/Runtime Error:/);
  });

  test("runtime error includes stack trace", async () => {
    const result = await runCLI(["run", "--eval", "List.first([])"]);
    const stderr = stripAnsi(result.stderr);
    expect(stderr).toMatch(/Stack trace:/);
    expect(stderr).toMatch(/List\.first/);
  });

  test("runtime error in function includes stack trace with location", async () => {
    const result = await runCLI([
      "run",
      "--eval",
      "f(x) = List.first(x); f([])",
    ]);
    const stderr = stripAnsi(result.stderr);
    expect(result.exitCode).toBe(1);
    expect(stderr).toMatch(/Stack trace:/);
    expect(stderr).toMatch(/line 1/);
  });

  test("valid code exits with code 0 and empty stderr", async () => {
    const result = await runCLI(["run", "--eval", "2+2"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("4\n");
  });

  test("valid void expression exits with code 0", async () => {
    const result = await runCLI(["run", "--eval", "x = 5"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
  });

  test("error with --quiet still shows error on stderr", async () => {
    const result = await runCLI(["run", "--eval", "List.first([])", "--quiet"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).not.toBe("");
    expect(stripAnsi(result.stderr)).toMatch(/Runtime Error:/);
  });

  test("error with --time still shows error and time", async () => {
    const result = await runCLI(["run", "--eval", "2+", "--time"]);
    expect(result.exitCode).toBe(1);
    expect(stripAnsi(result.stderr)).toMatch(/Compile Error:/);
  });

  test("nonexistent file produces error", async () => {
    const result = await runCLI(["run", "nonexistent_file_12345.squiggle"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("invalid import path produces error", async () => {
    const result = await runCLI([
      "run",
      "--eval",
      'import "absolute/path" as x',
    ]);
    expect(result.exitCode).toBe(1);
  });
});

describe("parse command error handling", () => {
  test("parse error exits with code 1", async () => {
    const result = await runCLI(["parse", "--eval", "2+"]);
    expect(result.exitCode).toBe(1);
  });

  test("parse error outputs to stderr", async () => {
    const result = await runCLI(["parse", "--eval", "2+"]);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toBe("");
  });

  test("valid code exits with code 0 and empty stderr", async () => {
    const result = await runCLI(["parse", "--eval", "2+2"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).not.toBe("");
  });

  test("typed mode error exits with code 1", async () => {
    const result = await runCLI([
      "parse",
      "--eval",
      "2+",
      "--mode",
      "typed",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).not.toBe("");
  });

  test("raw mode error exits with code 1", async () => {
    const result = await runCLI(["parse", "--eval", "2+", "--mode", "raw"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).not.toBe("");
  });
});

describe("print-ir command error handling", () => {
  test("parse error exits with code 1", async () => {
    const result = await runCLI(["print-ir", "--eval", "2+"]);
    expect(result.exitCode).toBe(1);
  });

  test("parse error outputs to stderr", async () => {
    const result = await runCLI(["print-ir", "--eval", "2+"]);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toBe("");
  });

  test("valid code exits with code 0", async () => {
    const result = await runCLI(["print-ir", "--eval", "2+2"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
  });
});

describe("general CLI error handling", () => {
  test("no arguments shows usage and exits with code 1", async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Usage:/);
  });

  test("unknown command exits with non-zero code", async () => {
    const result = await runCLI(["nonexistent-command"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("run with both filename and --eval produces error", async () => {
    const result = await runCLI(["run", "file.squiggle", "--eval", "2+2"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("run without filename or --eval produces error", async () => {
    const result = await runCLI(["run"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("--quiet and --show-bindings conflict produces error", async () => {
    const result = await runCLI([
      "run",
      "--eval",
      "2+2",
      "--quiet",
      "--show-bindings",
    ]);
    expect(result.exitCode).not.toBe(0);
  });
});
