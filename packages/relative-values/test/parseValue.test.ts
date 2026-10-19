import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import { findRelativeValuesExports, ModelEvaluator } from "../src/core.js";

// QA #46: a pair whose ratio is a point (p5 = p95, e.g. an item worth 0) has
// an uncertainty of log10(0 / 0) = NaN; it must read as a value, not as a
// validation error.

async function evaluatorOf(code: string): Promise<ModelEvaluator> {
  const [found] = findRelativeValuesExports(await run(code));
  if (!found.spec.ok) throw new Error(found.spec.value);
  const evaluator = await ModelEvaluator.fromSpec(found.spec.value);
  if (!evaluator.ok) throw new Error(evaluator.value);
  return evaluator.value;
}

const zeroRatio = `
values = {
  values: { nothing: 0, one: 1, some: 2 to 3 },
  recommendedUnit: "one",
}
`;

describe("parseRelativeValue", () => {
  test("a zero ratio is 0 with no uncertainty", async () => {
    const evaluator = await evaluatorOf(zeroRatio);
    const result = evaluator.compare("nothing", "one");
    expect(result).toEqual({
      ok: true,
      value: { median: 0, mean: 0, min: 0, max: 0, uncertainty: 0 },
    });
    const vsDist = evaluator.compare("nothing", "some");
    expect(vsDist.ok).toBe(true);
    if (vsDist.ok) expect(vsDist.value.uncertainty).toBe(0);
  });

  test("a constant ratio has no uncertainty", async () => {
    const evaluator = await evaluatorOf(
      `spec = { values: { a: 1, b: 4 }, recommendedUnit: "a" }`
    );
    expect(evaluator.compare("b", "a")).toEqual({
      ok: true,
      value: { median: 4, mean: 4, min: 4, max: 4, uncertainty: 0 },
    });
  });

  test("a spread ratio keeps its uncertainty", async () => {
    const evaluator = await evaluatorOf(zeroRatio);
    const result = evaluator.compare("some", "one");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.uncertainty).toBeGreaterThan(0);
    expect(result.value.min).toBeLessThan(result.value.max);
  });

  test("a non-numeric field is still a short error, not a JSON dump", async () => {
    const evaluator = await evaluatorOf(
      `spec = { items: ["a", "b"], fn: {|x, y| ["one", 1]} }`
    );
    const result = evaluator.compare("a", "b");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.value).not.toMatch(/"code"|invalid_type/);
  });
});
