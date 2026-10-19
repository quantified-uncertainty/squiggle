import { runCLI } from "../helpers/cliHelpers.js";

async function runJson(args: string[]) {
  const result = await runCLI(["run", "--json", ...args]);
  return { ...result, json: JSON.parse(result.stdout) };
}

describe("run --json", () => {
  test("number result", async () => {
    const { json, exitCode, stderr } = await runJson(["-e", "x = 2; x + 2"]);
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(json).toMatchObject({
      ok: true,
      result: 4,
      bindings: { x: 2 },
      errors: [],
    });
    expect(typeof json.timeMs).toBe("number");
    expect(json.exports).toBeUndefined();
  });

  test("void result has bindings", async () => {
    const { json } = await runJson(["-e", "x = 5"]);
    expect(json.result).toBeNull();
    expect(json.bindings).toEqual({ x: 5 });
  });

  test("distribution summary", async () => {
    const { json } = await runJson(["-e", "normal(10, 2)"]);
    expect(json.result).toMatchObject({ type: "Dist", subtype: "SampleSet" });
    for (const key of ["mean", "stdev", "p5", "p25", "p50", "p75", "p95"]) {
      expect(typeof json.result[key]).toBe("number");
    }
    expect(json.result.mean).toBeGreaterThan(9);
    expect(json.result.mean).toBeLessThan(11);
    expect(json.result.samples).toBeUndefined();
    expect(json.result.sampleCount).toBe(1000);
  });

  test("symbolic distribution", async () => {
    const { json } = await runJson(["-e", "Sym.normal(10, 2)"]);
    expect(json.result).toMatchObject({
      type: "Dist",
      subtype: "Symbolic",
      mean: 10,
      stdev: 2,
      description: "Normal(10,2)",
    });
  });

  test("--samples includes truncated samples", async () => {
    const { json } = await runJson(["-e", "normal(10, 2)", "--samples", "5"]);
    expect(json.result.samples).toHaveLength(5);
  });

  test("--sample-count", async () => {
    const { json } = await runJson(["-e", "normal(10, 2)", "-n", "50"]);
    expect(json.result.sampleCount).toBe(50);
  });

  test("--seed makes results reproducible and changes them", async () => {
    const a = await runJson(["-e", "normal(0, 1)", "--seed", "a"]);
    const a2 = await runJson(["-e", "normal(0, 1)", "--seed", "a"]);
    const b = await runJson(["-e", "normal(0, 1)", "--seed", "b"]);
    expect(a.json.result.mean).toBe(a2.json.result.mean);
    expect(a.json.result.mean).not.toBe(b.json.result.mean);
  });

  test("various value types", async () => {
    const { json } = await runJson([
      "-e",
      `@name("Population") @doc("people") pop = 5 to 10
f(x) = x * 2
d = Date(2024)
dur = 3days
s = "hi"
l = [1, true, {a: 1}]
inf = 1/0
p = Plot.dist(normal(1, 2))
c = Calculator(f)`,
    ]);
    const b = json.bindings;
    expect(b.pop).toMatchObject({
      type: "Dist",
      name: "Population",
      doc: "people",
    });
    expect(b.f).toMatchObject({ type: "Lambda", signature: "(x)" });
    expect(b.f.parameters).toEqual([[{ name: "x" }]]);
    expect(b.d).toMatchObject({ type: "Date" });
    expect(typeof b.d.iso).toBe("string");
    expect(b.dur).toMatchObject({ type: "Duration", ms: 3 * 24 * 3600 * 1000 });
    expect(b.s).toBe("hi");
    expect(b.l).toEqual([1, true, { a: 1 }]);
    expect(b.inf).toBe("Infinity");
    expect(b.p).toMatchObject({ type: "Plot", plotType: "distributions" });
    expect(b.p.distributions[0]).toMatchObject({ type: "Dist" });
    expect(b.c).toMatchObject({
      type: "Calculator",
      inputs: [{ name: "x" }],
    });
  });

  test("exports", async () => {
    const { json } = await runJson(["-e", "export x = 1\ny = 2"]);
    expect(json.exports).toEqual({ x: 1 });
  });

  test("compile error", async () => {
    const { json, exitCode } = await runJson(["-e", "x = List.sum([1])"]);
    expect(exitCode).toBe(1);
    expect(json.ok).toBe(false);
    expect(json.result).toBeNull();
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]).toMatchObject({
      kind: "compile",
      message: "List.sum is not defined",
      location: {
        file: "[eval]",
        start: { line: 1, column: 5 },
      },
    });
    expect(json.errors[0].hints.join(" ")).toMatch(/Number\.sum/);
  });

  test("runtime error with stack", async () => {
    const { json, exitCode } = await runJson([
      "-e",
      "f(x) = List.first(x)\nf([])",
    ]);
    expect(exitCode).toBe(1);
    expect(json.errors[0].kind).toBe("runtime");
    expect(json.errors[0].message).toMatch(/List must not be empty/);
    expect(json.errors[0].stack.map((f: { name: string }) => f.name)).toEqual([
      "List.first",
      "f",
      "<top>",
    ]);
  });
});

describe("run options", () => {
  test("SAMPLE_COUNT env var still works", async () => {
    process.env["SAMPLE_COUNT"] = "20";
    try {
      const result = await runCLI(["run", "--json", "-e", "normal(0, 1)"]);
      expect(JSON.parse(result.stdout).result.sampleCount).toBe(20);
    } finally {
      delete process.env["SAMPLE_COUNT"];
    }
  });

  test("--watch requires a filename", async () => {
    const result = await runCLI(["run", "-e", "1", "--watch"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("text errors include hints", async () => {
    const result = await runCLI(["run", "-e", "# comment\nx = 1"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Hint: .*Comments use \/\//);
  });
});
