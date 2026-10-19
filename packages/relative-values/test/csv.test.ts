import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import {
  createRelativeValuesBundle,
  findRelativeValuesExports,
  ModelEvaluator,
  RELATIVE_VALUES_CSV_ERROR,
  relativeValuesBundleToCsv,
  type RelativeValuesBundle,
} from "../src/core.js";

async function bundleOf(code: string): Promise<RelativeValuesBundle> {
  const [found] = findRelativeValuesExports(await run(code));
  if (!found.spec.ok) throw new Error(found.spec.value);
  const evaluator = await ModelEvaluator.fromSpec(found.spec.value);
  if (!evaluator.ok) throw new Error(evaluator.value);
  return createRelativeValuesBundle({
    definition: found.spec.value.definition,
    evaluator: evaluator.value,
    meta: { variableName: found.name },
    precision: 3,
  });
}

const errorCode = `
dists = { alpha: 1, beta: 2, broken: 1 }
spec = {
  items: ["alpha", "beta", "broken"],
  fn: {|a, b|
    if a == "broken" || b == "broken" then throw("No estimate") else [
      dists[a],
      dists[b],
    ]},
}
`;

describe("relativeValuesBundleToCsv", () => {
  test("wide matrix of medians: header of column ids, a row id per line", async () => {
    const bundle = await bundleOf(`spec = { values: { a: 1, b: 2, c: 4 } }`);
    expect(relativeValuesBundleToCsv(bundle)).toBe(
      [",a,b,c", "a,1,0.5,0.25", "b,2,1,0.5", "c,4,2,1", ""].join("\n")
    );
  });

  test("another metric", async () => {
    const bundle = await bundleOf(`spec = { values: { a: 1, b: 2 } }`);
    expect(relativeValuesBundleToCsv(bundle, { metric: "uncertainty" })).toBe(
      [",a,b", "a,0,0", "b,0,0", ""].join("\n")
    );
  });

  test("failed comparisons are ERR in the wide matrix", async () => {
    const bundle = await bundleOf(errorCode);
    const lines = relativeValuesBundleToCsv(bundle).trimEnd().split("\n");
    expect(lines[0]).toBe(",alpha,beta,broken");
    expect(lines[1]).toBe(`alpha,1,0.5,${RELATIVE_VALUES_CSV_ERROR}`);
    expect(lines[3]).toBe(
      `broken,${RELATIVE_VALUES_CSV_ERROR},${RELATIVE_VALUES_CSV_ERROR},${RELATIVE_VALUES_CSV_ERROR}`
    );
  });

  test("long: one tidy row per pair, with the error message", async () => {
    const bundle = await bundleOf(errorCode);
    const lines = relativeValuesBundleToCsv(bundle, { long: true })
      .trimEnd()
      .split("\n");
    expect(lines[0]).toBe("row,col,median,mean,min,max,uncertainty,error");
    expect(lines).toHaveLength(1 + 9);
    expect(lines[2]).toBe("alpha,beta,0.5,0.5,0.5,0.5,0,");
    const broken = lines.find((l) => l.startsWith("alpha,broken,"));
    expect(broken).toMatch(/^alpha,broken,,,,,,.*No estimate/);
  });

  test("quotes ids with commas and quotes", async () => {
    const bundle = await bundleOf(
      `spec = { items: ["a,b", "say \\"hi\\""], fn: {|x, y| [1, 1]} }`
    );
    const [header] = relativeValuesBundleToCsv(bundle).split("\n");
    expect(header).toBe(`,"a,b","say ""hi"""`);
  });

  test("division by zero is an error cell", async () => {
    const bundle = await bundleOf(`spec = { values: { zero: 0, one: 1 } }`);
    const csv = relativeValuesBundleToCsv(bundle);
    expect(csv.split("\n")[2]).toBe(`one,${RELATIVE_VALUES_CSV_ERROR},1`);
  });

  test("non-finite numbers are written as in the bundle", async () => {
    const bundle = await bundleOf(`spec = { values: { a: 1, b: 2 } }`);
    const value = {
      median: "Infinity" as const,
      mean: "NaN" as const,
      min: 1,
      max: "-Infinity" as const,
      uncertainty: 0,
    };
    const patched: RelativeValuesBundle = {
      ...bundle,
      pairs: bundle.pairs.map(([id1, id2, v]) =>
        id1 === "a" && id2 === "b" ? [id1, id2, value] : [id1, id2, v]
      ),
    };
    expect(relativeValuesBundleToCsv(patched).split("\n")[1]).toBe(
      "a,1,Infinity"
    );
    expect(
      relativeValuesBundleToCsv(patched, { long: true }).split("\n")[2]
    ).toBe("a,b,Infinity,NaN,1,-Infinity,0,");
  });

  test("rejects an unknown metric", async () => {
    const bundle = await bundleOf(`spec = { values: { a: 1, b: 2 } }`);
    expect(() =>
      relativeValuesBundleToCsv(bundle, {
        metric: "p50" as "median",
      })
    ).toThrow(/Unknown metric "p50"/);
  });
});
