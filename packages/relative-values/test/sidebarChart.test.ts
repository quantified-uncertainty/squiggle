import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import {
  InMemoryRelativeValuesCache,
  type Item,
  ModelEvaluator,
  relativeValuesPairCharts,
} from "../src/core.js";
import { readExample } from "./helpers.js";

// QA #27: the list sidebar's pair charts failed on numeric values (Plot.dist
// got a Number) and on models ending in a result expression (code appended
// after the result is a parse error). The charts now come from the
// evaluator's own pair values, sampled by a fixed helper, in a standalone
// program that doesn't contain the user's model.

const item = (id: string): Item => ({
  id,
  name: id,
  clusterId: null,
  description: "",
});

async function evaluatorOf(code: string, variable = "spec") {
  const evaluator = await ModelEvaluator.create(code, variable);
  if (!evaluator.ok) throw new Error(evaluator.value);
  return evaluator.value;
}

// Runs the chart program; resolves to its binding names and result tag.
async function runCharts(
  evaluator: ModelEvaluator,
  numerator: string,
  denominator: string
) {
  const code = await relativeValuesPairCharts(
    evaluator,
    item(numerator),
    item(denominator)
  );
  if (!code.ok) throw new Error(code.value);
  const output = await run(code.value);
  const bindings = output.getBindings();
  if (!bindings.ok) throw new Error(bindings.value.toString());
  if (!output.result.ok) throw new Error(output.result.value.toString());
  return {
    code: code.value,
    bindings: bindings.value.entries().map(([key]) => key),
    result: output.result.value.result.tag,
  };
}

describe("relativeValuesPairCharts", () => {
  test("numeric values", async () => {
    const evaluator = await evaluatorOf(
      `spec = { values: { apple: 1, banana: 0.5 to 2, mango: 3 } }`
    );
    for (const [a, b] of [
      ["banana", "apple"],
      ["apple", "mango"],
      ["mango", "apple"],
    ]) {
      const charts = await runCharts(evaluator, a, b);
      expect(charts.bindings).toEqual(
        expect.arrayContaining(["ratio", "scatter", "distributions"])
      );
      expect(charts.result).toBe("Dict");
    }
  });

  test("a model that ends in a result expression", async () => {
    const model = `
d = { a: 1 to 2, b: 2 to 5, c: 10 to 20 }
spec = { items: ["a", "b", "c"], fn: {|x, y| [d[x], d[y]]} }
// A model that ends with a result expression
d.a + d.b
`;
    const charts = await runCharts(await evaluatorOf(model), "b", "a");
    expect(charts.result).toBe("Dict");
    // The chart program doesn't contain the model.
    expect(charts.code).not.toContain("d.a + d.b");
  });

  test("the shipped values example", async () => {
    const evaluator = await evaluatorOf(
      readExample("health-interventions.squiggle"),
      "healthInterventions"
    );
    const charts = await runCharts(
      evaluator,
      "biking_10min",
      "walking_in_nature_10min"
    );
    expect(charts.bindings).toContain("ratio");
  });

  test("tiny and huge samples are valid literals", async () => {
    const evaluator = await evaluatorOf(
      `spec = { values: { tiny: 1e-30 to 1e-25, huge: 1e25 to 1e30 } }`
    );
    expect((await runCharts(evaluator, "huge", "tiny")).result).toBe("Dict");
  });

  test("a failing comparison is labelled", async () => {
    const evaluator = await evaluatorOf(`
spec = {
  items: ["ok", "broken"],
  fn: {|x, y| if x == "broken" then throw("No estimate") else [1, 2]},
}`);
    const charts = await relativeValuesPairCharts(
      evaluator,
      item("broken"),
      item("ok")
    );
    expect(charts.ok).toBe(false);
    if (charts.ok) return;
    expect(charts.value).toMatch(/^Comparison failed: .*No estimate/);
  });

  test("cache-only evaluators have no charts", async () => {
    const evaluator = ModelEvaluator.fromCache(
      new InMemoryRelativeValuesCache()
    );
    const charts = await relativeValuesPairCharts(
      evaluator,
      item("a"),
      item("b")
    );
    expect(charts).toEqual({
      ok: false,
      value: "Charts aren't available for precomputed values",
    });
  });
});
