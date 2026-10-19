import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import {
  findRelativeValuesExports,
  InMemoryRelativeValuesCache,
  makePairKey,
  ModelEvaluator,
  parsePairKey,
  RelativeValueResult,
} from "../src/index.js";
import { readExample } from "./helpers.js";

function unwrap<T>(
  result: { ok: true; value: T } | { ok: false; value: string }
): T {
  if (!result.ok) {
    throw new Error(result.value);
  }
  return result.value;
}

// Hub-style model: a top-level, non-exported function.
const legacyModel = `
items = { a: 1, b: 2 to 5, c: -(1 to 3) }
fn(x, y) = [items[x], items[y]]
`;

describe("ModelEvaluator.create", () => {
  test("works with non-exported functions", async () => {
    const evaluator = unwrap(await ModelEvaluator.create(legacyModel, "fn"));
    expect(evaluator.fnExpression).toBe("fn");
    expect(evaluator.modelCode).toBe(legacyModel);

    const same = unwrap(evaluator.compare("a", "a"));
    expect(same).toEqual({
      median: 1,
      mean: 1,
      min: 1,
      max: 1,
      uncertainty: 0,
    });

    const ba = unwrap(evaluator.compare("b", "a"));
    expect(ba.median).toBeGreaterThan(2);
    expect(ba.median).toBeLessThan(5);
    expect(ba.min).toBeLessThan(ba.median);
    expect(ba.max).toBeGreaterThan(ba.median);
    expect(ba.uncertainty).toBeGreaterThan(0);

    const ca = unwrap(evaluator.compare("c", "a"));
    expect(ca.median).toBeLessThan(0);
  });

  test("works with spec dicts", async () => {
    const code = `spec = { values: { a: 1, b: 2 to 5 } }`;
    const evaluator = unwrap(await ModelEvaluator.create(code, "spec"));
    expect(evaluator.fnExpression).toContain("spec.values");
    expect(unwrap(evaluator.compare("b", "a")).median).toBeGreaterThan(2);
  });

  test("errors", async () => {
    expect((await ModelEvaluator.create("x = ", "fn")).ok).toBe(false);
    expect((await ModelEvaluator.create("x = 1", "fn")).ok).toBe(false);
    const notAFunction = await ModelEvaluator.create("fn = 1", "fn");
    expect(notAFunction.ok).toBe(false);
  });

  test("errors in comparisons are reported per pair", async () => {
    const evaluator = unwrap(await ModelEvaluator.create(legacyModel, "fn"));
    const result = evaluator.compare("a", "unknown");
    expect(result.ok).toBe(false);
  });
});

describe("cache", () => {
  test("results are cached", async () => {
    const cache = new InMemoryRelativeValuesCache();
    const evaluator = unwrap(
      await ModelEvaluator.create(legacyModel, "fn", { cache })
    );
    const first = evaluator.compare("b", "a");
    expect(cache.size).toBe(1);
    expect(cache.get(makePairKey("b", "a"))).toBe(first);
    expect(evaluator.compare("b", "a")).toBe(first);

    evaluator.compareAll(["a", "b", "c"]);
    expect(cache.size).toBe(9);
  });

  test("prefilled cache is used", async () => {
    const fake: RelativeValueResult = {
      ok: true,
      value: { median: 42, mean: 42, min: 42, max: 42, uncertainty: 0 },
    };
    const cache = new InMemoryRelativeValuesCache([
      [makePairKey("a", "b"), fake],
    ]);
    const evaluator = unwrap(
      await ModelEvaluator.create(legacyModel, "fn", { cache })
    );
    expect(evaluator.compare("a", "b")).toBe(fake);
  });

  test("custom cache implementation", async () => {
    const store: Record<string, RelativeValueResult> = {};
    const evaluator = unwrap(
      await ModelEvaluator.create(legacyModel, "fn", {
        cache: {
          get: (key) => store[key],
          set: (key, value) => {
            store[key] = value;
          },
        },
      })
    );
    evaluator.compare("a", "b");
    expect(Object.keys(store).map(parsePairKey)).toEqual([["a", "b"]]);
  });
});

describe("fromSpec", () => {
  test("examples evaluate", async () => {
    for (const file of ["quri.squiggle", "health-interventions.squiggle"]) {
      const code = readExample(file);
      const [found] = findRelativeValuesExports(await run(code));
      const spec = unwrap(found.spec);
      const evaluator = unwrap(
        await ModelEvaluator.fromSpec(spec, { modelCode: code })
      );
      const ids = spec.definition.items.slice(0, 4).map((item) => item.id);
      const results = evaluator.compareAll(ids);
      expect(results.every((r) => r.ok)).toBe(true);

      const [low, high] = evaluator.getParamPercentiles(
        ids,
        (r) => r.uncertainty,
        [10, 90]
      );
      expect(low).toBeLessThanOrEqual(high);
    }
  });

  test("sidebar code evaluates", async () => {
    const code = `spec = { values: { a: 1, b: 2 to 5 } }`;
    const evaluator = unwrap(await ModelEvaluator.create(code, "spec"));
    const output = await run(
      `${code}\nf = ${evaluator.fnExpression}\nf("b", "a")`
    );
    const result = output.getEndResult();
    expect(result.ok).toBe(true);
  });
});
