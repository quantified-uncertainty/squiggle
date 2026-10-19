import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import { buildPairSquiggleCode } from "../src/lib/pairSquiggleCode.js";

// Hub-style model; `apple` is a plain number, as in examples/minimal.squiggle.
const modelCode = `
dists = { apple: 1, banana: 0.5 to 2, "mango-x": 2 to 6 }
fn(a, b) = [dists[a], dists[b]]
`;

const item = (id: string) => ({ id, name: id, description: "" });

describe("buildPairSquiggleCode", () => {
  test.each([
    ["banana", "apple"],
    ["apple", "banana"],
    ["apple", "apple"],
    ["mango-x", "banana"],
  ])("%s / %s evaluates without errors", async (numerator, denominator) => {
    const code = buildPairSquiggleCode({
      modelCode,
      fnExpression: "fn",
      numeratorItem: item(numerator),
      denominatorItem: item(denominator),
    });
    const output = await run(code);
    const bindings = output.getBindings();
    if (!bindings.ok) {
      throw new Error(bindings.value.toString());
    }
    expect(output.result.ok).toBe(true);
    expect(bindings.value.get("debug")?.tag).toBe("Array");
  });
});
