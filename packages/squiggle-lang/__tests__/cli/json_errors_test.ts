import { jest } from "@jest/globals";
import * as path from "path";
import * as url from "url";

import { SqProject } from "../../src/public/SqProject/index.js";
import { SqModule } from "../../src/public/SqProject/SqModule.js";
import { runCLI } from "../helpers/cliHelpers.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const nestedFixture = path.join(
  __dirname,
  "..",
  "fixtures",
  "invalid-imports",
  "main.squiggle"
);

async function runJson(args: string[]) {
  const result = await runCLI([...args, "--json"]);
  return { ...result, json: JSON.parse(result.stdout) };
}

afterEach(() => {
  jest.restoreAllMocks();
});

// Imports that the file linker can't resolve; `resolve` throws for them.
describe.each([
  ['import "hub:quri/x" as x\nx', "hub:quri/x"],
  ['import "foo" as f\nf', "foo"],
])("unresolvable import %j", (code, importName) => {
  const location = {
    file: "[eval]",
    start: { line: 1, column: 8 },
    end: { line: 1, column: 10 + importName.length },
  };

  test("run --json", async () => {
    const { json, exitCode, stderr } = await runJson(["run", "-e", code]);
    expect(exitCode).toBe(1);
    expect(stderr).toBe("");
    expect(json).toMatchObject({ ok: false, result: null, bindings: {} });
    expect(json.errors).toEqual([
      {
        kind: "other",
        message: `Error: Only relative paths in imports are allowed, got "${importName}"`,
        location,
        importChain: [importName],
      },
    ]);
  });

  test("check --json", async () => {
    const { json, exitCode, stderr } = await runJson(["check", "-e", code]);
    expect(exitCode).toBe(1);
    expect(stderr).toBe("");
    expect(json).toMatchObject({ ok: false, ran: false });
    expect(json.errors).toEqual([
      {
        kind: "compile",
        message: `Only relative paths in imports are allowed, got "${importName}"`,
        location,
      },
    ]);
  });
});

describe("unresolvable nested import", () => {
  test("run --json points to the import in the imported file", async () => {
    const { json, exitCode } = await runJson(["run", nestedFixture]);
    expect(exitCode).toBe(1);
    expect(json.ok).toBe(false);
    expect(json.errors).toHaveLength(1);
    const [error] = json.errors;
    expect(error.message).toMatch(/got "hub:quri\/x"/);
    expect(error.location.file).toMatch(/invalid-imports\/lib\.squiggle$/);
    expect(error.location.start).toEqual({ line: 1, column: 8 });
    expect(error.importChain[0]).toBe("hub:quri/x");
    expect(error.importChain[1]).toMatch(/invalid-imports\/lib\.squiggle$/);
  });

  test("check --json", async () => {
    const { json, exitCode } = await runJson(["check", nestedFixture]);
    expect(exitCode).toBe(1);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0].message).toMatch(/got "hub:quri\/x"/);
    expect(json.errors[0].location.file).toMatch(/lib\.squiggle$/);
  });

  test("text output", async () => {
    const result = await runCLI(["run", nestedFixture]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/got "hub:quri\/x"/);
  });
});

describe("unexpected exceptions with --json", () => {
  test("run --json reports them as a JSON object", async () => {
    jest
      .spyOn(SqProject.prototype, "waitForOutput")
      .mockRejectedValue(new Error("boom"));
    const { json, exitCode, stderr } = await runJson(["run", "-e", "1"]);
    expect(exitCode).toBe(1);
    expect(stderr).toBe("");
    expect(json).toEqual({
      ok: false,
      result: null,
      bindings: {},
      errors: [{ kind: "internal", message: "boom" }],
      timeMs: 0,
    });
  });

  test("check --json reports them as a JSON object", async () => {
    jest.spyOn(SqModule.prototype, "typedAst").mockImplementation(() => {
      throw new Error("boom");
    });
    const { json, exitCode, stderr } = await runJson(["check", "-e", "1"]);
    expect(exitCode).toBe(1);
    expect(stderr).toBe("");
    expect(json).toEqual({
      ok: false,
      files: [],
      errors: [{ kind: "internal", message: "boom" }],
      warnings: [],
      ran: false,
    });
  });
});
