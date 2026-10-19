import { describe, expect, jest, test } from "@jest/globals";

import {
  ComputeProgress,
  InMemoryRelativeValuesCache,
  ModelEvaluator,
} from "../src/index.js";

const code = `
dists = { a: 1, b: 2 to 5, c: 3 to 8, d: 1 to 2, e: 10 to 20 }
spec = { values: dists }
`;
const ids = ["a", "b", "c", "d", "e"];

async function makeEvaluator() {
  const cache = new InMemoryRelativeValuesCache();
  const result = await ModelEvaluator.create(code, "spec", { cache });
  if (!result.ok) {
    throw new Error(result.value);
  }
  return { evaluator: result.value, cache };
}

describe("computeAll", () => {
  test("returns the same results as compareAll and fills the cache", async () => {
    const { evaluator, cache } = await makeEvaluator();
    const results = await evaluator.computeAll(ids);
    expect(cache.size).toBe(ids.length ** 2);
    const reference = (await makeEvaluator()).evaluator.compareAll(ids);
    expect(results).toEqual(reference);
    expect(evaluator.isCached([["a", "e"]])).toBe(true);
  });

  test("yields to the event loop and reports progress", async () => {
    const { evaluator } = await makeEvaluator();
    let timerFired = false;
    setTimeout(() => {
      timerFired = true;
    }, 0);
    const progress: ComputeProgress[] = [];
    let timerFiredDuringComputation = false;
    await evaluator.computeAll(ids, {
      sliceMs: 0, // yield before every pair
      onProgress: (p) => {
        progress.push(p);
        if (p.done < p.total && timerFired) {
          timerFiredDuringComputation = true;
        }
      },
    });
    expect(timerFiredDuringComputation).toBe(true);
    const total = ids.length ** 2;
    expect(progress.every((p) => p.total === total)).toBe(true);
    expect(progress.at(-1)).toEqual({ done: total, total });
    const done = progress.map((p) => p.done);
    expect(done).toEqual([...done].sort((x, y) => x - y));
    expect(progress.length).toBeGreaterThan(total / 2);
  });

  test("cached pairs are skipped without yielding", async () => {
    const { evaluator } = await makeEvaluator();
    await evaluator.computeAll(ids);
    const progress: ComputeProgress[] = [];
    await evaluator.computeAll(ids, {
      sliceMs: 0,
      onProgress: (p) => progress.push(p),
    });
    expect(progress).toEqual([{ done: 25, total: 25 }]);
  });

  test("abort", async () => {
    const { evaluator, cache } = await makeEvaluator();
    const controller = new AbortController();
    const promise = evaluator.computeAll(ids, {
      sliceMs: 0,
      signal: controller.signal,
      onProgress: ({ done }) => {
        if (done >= 3) {
          controller.abort();
        }
      },
    });
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(cache.size).toBeGreaterThanOrEqual(3);
    expect(cache.size).toBeLessThan(ids.length ** 2);

    // Already aborted
    await expect(
      evaluator.computeAll(ids, { signal: AbortSignal.abort() })
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  test("computePairs computes only the given pairs", async () => {
    const { evaluator, cache } = await makeEvaluator();
    const results = await evaluator.computePairs([
      ["b", "a"],
      ["c", "a"],
    ]);
    expect(results.map((r) => r.ok)).toEqual([true, true]);
    expect(cache.size).toBe(2);
    expect(evaluator.isCached([["b", "a"]])).toBe(true);
    expect(evaluator.isCached([["a", "b"]])).toBe(false);
  });
});

describe("sharing an evaluator", () => {
  test("two interleaved loops compute each pair once", async () => {
    const { evaluator, cache } = await makeEvaluator();
    const set = jest.spyOn(cache, "set");
    const all = ids.flatMap((a) => ids.map((b): [string, string] => [a, b]));
    await Promise.all([
      evaluator.computePairs(all, { sliceMs: 0 }),
      evaluator.computePairs([...all].reverse(), { sliceMs: 0 }),
    ]);
    expect(set).toHaveBeenCalledTimes(all.length);
    expect(cache.size).toBe(all.length);
  });

  test("peek never computes", async () => {
    const { evaluator, cache } = await makeEvaluator();
    const spy = jest.spyOn(evaluator, "compareWithoutCache");
    expect(evaluator.peek("b", "a")).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    expect(cache.size).toBe(0);
    const computed = evaluator.compare("b", "a");
    expect(evaluator.peek("b", "a")).toBe(computed);
  });
});
