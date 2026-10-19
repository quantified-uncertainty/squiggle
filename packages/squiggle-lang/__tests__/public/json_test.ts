import {
  exceptionToErrorJson,
  formatSqNumber,
  sqErrorToJson,
  sqModuleOutputToJson,
  warningsForSources,
} from "../../src/public/json.js";
import { makeSelfContainedLinker } from "../../src/public/SqLinker.js";
import { SqProject } from "../../src/public/SqProject/index.js";
import { SqModule } from "../../src/public/SqProject/SqModule.js";

// Runs `sources.main` with every entry of `sources` importable by name.
async function runSources(sources: Record<string, string>) {
  const project = new SqProject({ linker: makeSelfContainedLinker(sources) });
  project.setHead("main", {
    module: new SqModule({ name: "main", code: sources["main"] }),
  });
  const output = await project.waitForOutput("main");
  return { output, sources: new Map(Object.entries(sources)) };
}

async function runJson(sources: Record<string, string>) {
  const { output, sources: map } = await runSources(sources);
  return sqModuleOutputToJson(output, map);
}

describe("sqModuleOutputToJson", () => {
  test("ok run with bindings, a result and exports", async () => {
    const json = await runJson({
      main: "export x = 2\ny = x * 3\ny + 1",
    });
    expect(json).toMatchObject({
      ok: true,
      result: 7,
      bindings: { x: 2, y: 6 },
      exports: { x: 2 },
      errors: [],
    });
    expect(typeof json.timeMs).toBe("number");
  });

  test("no exports: the field is omitted; a void result is null", async () => {
    const json = await runJson({ main: "x = 5" });
    expect(json.exports).toBeUndefined();
    expect(json.result).toBeNull();
    expect(json.bindings).toEqual({ x: 5 });
  });

  test("samples option", async () => {
    const { output, sources } = await runSources({ main: "normal(10, 2)" });
    const json = sqModuleOutputToJson(output, sources, { samples: 3 });
    expect(json.result).toMatchObject({ type: "Dist", subtype: "SampleSet" });
    expect((json.result as { samples: number[] }).samples).toHaveLength(3);
  });

  // A discrete-only point set's summary throws ("empty XYShape") at the time
  // of writing; the serializer reports that instead of throwing.
  test("never throws", async () => {
    const { output, sources } = await runSources({
      main: "d = mx(1, 2, 3, [0.2, 0.5, 0.3])",
    });
    const json = sqModuleOutputToJson(output, sources);
    if (!json.ok) {
      expect(json.errors).toEqual([
        { kind: "internal", message: expect.any(String) },
      ]);
    }
  });

  test("parse error", async () => {
    const json = await runJson({ main: "x = \ny = 2" });
    expect(json.ok).toBe(false);
    expect(json.result).toBeNull();
    expect(json.bindings).toEqual({});
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]).toMatchObject({
      kind: "compile",
      location: { file: "main", start: { line: 2 } },
    });
  });

  test("runtime error with a stack", async () => {
    const json = await runJson({
      main: 'check(x) = x > 0 ? x : throw("negative")\nscaled(x) = check(x) * 2\ny = scaled(-1)',
    });
    expect(json.ok).toBe(false);
    const [error] = json.errors;
    expect(error).toMatchObject({
      kind: "runtime",
      message: expect.stringContaining("negative"),
      location: { file: "main", start: { line: 1 } },
    });
    expect(error.stack?.map((frame) => frame.name)).toEqual(
      expect.arrayContaining(["check", "scaled"])
    );
  });

  test("import error with its chain", async () => {
    const json = await runJson({
      main: 'import "middle" as m\nx = m.y',
      middle: 'import "bottom" as b\nexport y = b.z',
      bottom: "export z = 1 / foo",
    });
    expect(json.ok).toBe(false);
    const [error] = json.errors;
    expect(error).toMatchObject({
      kind: "compile",
      location: { file: "bottom" },
    });
    // Innermost import first.
    expect(error.importChain).toEqual(["bottom", "middle"]);
  });

  test("a failing import points to the import statement", async () => {
    const json = await runJson({ main: '\nimport "missing" as m\nx = m' });
    const [error] = json.errors;
    expect(error.kind).toBe("other");
    expect(error.location).toMatchObject({
      file: "main",
      start: { line: 2 },
    });
  });
});

describe("sqErrorToJson", () => {
  test("hints use the offending line from `sources`", async () => {
    const { output, sources } = await runSources({ main: "x = null" });
    expect(output.result.ok).toBe(false);
    if (output.result.ok) return;
    const [error] = output.result.value.errors;
    const json = sqErrorToJson(error, sources);
    expect(json.hints?.[0]).toMatch(/no 'null'/);
  });
});

test("exceptionToErrorJson", () => {
  expect(exceptionToErrorJson(new Error("boom"))).toEqual({
    kind: "internal",
    message: "boom",
  });
  expect(exceptionToErrorJson("plain")).toEqual({
    kind: "internal",
    message: "plain",
  });
});

test("warningsForSources", () => {
  const warnings = warningsForSources(
    new Map([["a.squiggle", "x = 1\nf(t: Number) = t"]])
  );
  for (const warning of warnings) {
    expect(warning.file).toBe("a.squiggle");
    expect(typeof warning.line).toBe("number");
  }
});

test("formatSqNumber", () => {
  expect(formatSqNumber(8278.4, "$,.0f")).toBe("$8,278");
  expect(formatSqNumber(0.5, ".0%")).toBe("50%");
  expect(formatSqNumber(8278.4)).toBe("8280");
  expect(formatSqNumber(82784)).toBe("82.8K");
  expect(formatSqNumber(12.345)).toBe("12.3");
});
