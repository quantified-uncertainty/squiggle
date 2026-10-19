import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import {
  createRelativeValuesBundle,
  findRelativeValuesExports,
  makePairKey,
  ModelEvaluator,
  parseRelativeValuesBundle,
  RelativeValuesBundle,
  RelativeValuesSpec,
  stringifyRelativeValuesBundle,
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

async function specFromCode(code: string): Promise<RelativeValuesSpec> {
  const [found] = findRelativeValuesExports(await run(code));
  return unwrap(found.spec);
}

async function makeBundle(code: string) {
  const spec = await specFromCode(code);
  const evaluator = unwrap(await ModelEvaluator.fromSpec(spec));
  const bundle = await createRelativeValuesBundle({
    definition: spec.definition,
    evaluator,
    meta: { variableName: spec.variableName ?? "" },
  });
  return { spec, evaluator, bundle };
}

// Like JSON round-trip through a file.
function roundTrip(bundle: RelativeValuesBundle): RelativeValuesBundle {
  return unwrap(
    parseRelativeValuesBundle(JSON.parse(stringifyRelativeValuesBundle(bundle)))
  );
}

describe("bundles", () => {
  test("round trip: bundle evaluator returns the same results", async () => {
    const { spec, evaluator, bundle } = await makeBundle(
      readExample("health-interventions.squiggle")
    );
    const ids = spec.definition.items.map((item) => item.id);
    expect(bundle.version).toBe(1);
    expect(bundle.pairs.length).toBe(ids.length ** 2);
    expect(bundle.definition).toEqual(spec.definition);
    expect(bundle.meta).toMatchObject({
      variableName: "healthInterventions",
      seed: "default-seed",
      sampleCount: 1000,
    });
    expect(Date.parse(bundle.meta.generatedAt)).not.toBeNaN();

    const loaded = ModelEvaluator.fromBundle(roundTrip(bundle));
    expect(loaded.canCompute).toBe(false);
    expect(loaded.compareAll(ids)).toEqual(evaluator.compareAll(ids));
  });

  test("non-finite numbers and errors survive JSON", async () => {
    // b / a has p5 = 0, so its uncertainty is Infinity; a / b divides by zero.
    const { evaluator, bundle } = await makeBundle(`
dists = { a: 1, b: mx(0, 2 to 3, [0.5, 0.5]) }
spec = {
  items: ["a", "b", "missing"],
  fn: {|x, y| [dists[x], dists[y]]},
}`);
    const json = stringifyRelativeValuesBundle(bundle);
    expect(json).toContain('"uncertainty":"Infinity"');

    const loaded = ModelEvaluator.fromBundle(roundTrip(bundle));
    expect(loaded.compare("b", "a")).toMatchObject({
      ok: true,
      value: { uncertainty: Infinity },
    });
    const ids = ["a", "b", "missing"];
    for (const id1 of ids) {
      for (const id2 of ids) {
        const original = evaluator.compare(id1, id2);
        const restored = loaded.compare(id1, id2);
        expect(restored.ok).toBe(original.ok);
        if (original.ok && restored.ok) {
          for (const key of Object.keys(original.value) as Array<
            keyof typeof original.value
          >) {
            expect(Object.is(restored.value[key], original.value[key])).toBe(
              true
            );
          }
        } else {
          expect(restored.value).toBe(original.value);
        }
      }
    }
    expect(loaded.compare("a", "b")).toMatchObject({ ok: false });
    expect(loaded.compare("missing", "a")).toMatchObject({ ok: false });
  });

  test("bundles are deterministic for a given seed", async () => {
    const code = readExample("minimal.squiggle");
    const first = await makeBundle(code);
    const second = await makeBundle(code);
    expect(second.bundle.pairs).toEqual(first.bundle.pairs);
  });

  test("cache-only evaluators don't compute or cache missing pairs", async () => {
    const { bundle } = await makeBundle(readExample("minimal.squiggle"));
    const evaluator = ModelEvaluator.fromBundle({
      ...bundle,
      pairs: bundle.pairs.slice(0, 1),
    });
    const [[id1, id2]] = bundle.pairs;
    expect(evaluator.compare(id1, id2).ok).toBe(true);
    const missing = evaluator.compare("banana", "mango");
    expect(missing).toEqual({
      ok: false,
      value: "No precomputed value for banana / mango",
    });
    expect(evaluator.cache.get(makePairKey("banana", "mango"))).toBeUndefined();
    await expect(
      createRelativeValuesBundle({
        definition: bundle.definition,
        evaluator,
        meta: { variableName: "x" },
      })
    ).rejects.toThrow("cache-only");
  });

  test("custom metadata is kept", async () => {
    const spec = await specFromCode(readExample("minimal.squiggle"));
    const evaluator = unwrap(await ModelEvaluator.fromSpec(spec));
    const bundle = await createRelativeValuesBundle({
      definition: spec.definition,
      evaluator,
      meta: { variableName: "fruit", generatedAt: "2026-01-01", team: "ops" },
    });
    expect(roundTrip(bundle).meta).toMatchObject({
      generatedAt: "2026-01-01",
      team: "ops",
    });
  });

  describe("validation", () => {
    test.each([
      [null, "Invalid relative values bundle"],
      [{ version: 2 }, "Unsupported relative values bundle version: 2"],
      [{ version: 1 }, "definition"],
    ])("%j", (json, message) => {
      const result = parseRelativeValuesBundle(json);
      expect(result.ok).toBe(false);
      expect(result.value).toContain(message);
    });

    test("unknown ids and malformed values", async () => {
      const { bundle } = await makeBundle(readExample("minimal.squiggle"));
      const withUnknownId = {
        ...bundle,
        pairs: [["apple", "pear", { error: "x" }]],
      };
      expect(parseRelativeValuesBundle(withUnknownId).value).toContain(
        "Unknown item id: pear"
      );
      const withBadValue = {
        ...bundle,
        pairs: [["apple", "apple", { median: "big" }]],
      };
      expect(parseRelativeValuesBundle(withBadValue).ok).toBe(false);
    });
  });
});
