import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import {
  findRelativeValuesExports,
  looksLikeRelativeValuesSpec,
} from "../src/core.js";

// QA #30: a spec with a mistake must still be detected, so that its validation
// message is shown instead of the relative values view silently disappearing.

async function detect(code: string) {
  const output = await run(code);
  return findRelativeValuesExports(output).map((found) => ({
    name: found.name,
    ok: found.spec.ok,
    error: found.spec.ok ? undefined : found.spec.value,
  }));
}

describe("detection is looser than validation", () => {
  test.each([
    [
      "a string among the values",
      `fruit = { values: { apple: 1, banana: 0.5 to 2, mango: "two to six" } }`,
      "values.mango must be a distribution or a number, got String",
    ],
    [
      "a non-function fn",
      `spec = { items: ["a", "b"], fn: 3 }`,
      '"fn" must be a function, got Number',
    ],
    [
      "items that aren't a list",
      `spec = { items: "a, b", fn: {|a, b| [1, 2]} }`,
      '"items" must be a list, got String',
    ],
    [
      "an empty values dict",
      `spec = { values: {} }`,
      "Relative values spec must have at least one item",
    ],
    [
      "a dict among the values",
      `spec = { values: { a: 1, b: { low: 1, high: 2 } } }`,
      "values.b must be a distribution or a number, got Dict",
    ],
  ])("%s is detected and explained", async (_name, code, message) => {
    const [found] = await detect(code);
    expect(found).toBeDefined();
    expect(found?.ok).toBe(false);
    expect(found?.error).toBe(message);
  });

  test("a single value (e.g. while typing) is a valid one-item spec", async () => {
    expect(await detect(`fruit = { values: { apple: 1 } }`)).toEqual([
      { name: "fruit", ok: true, error: undefined },
    ]);
  });

  test.each([
    [`spec = { fn: {|a, b| [1, 2]} }`, "fn without items"],
    [`spec = { values: 3 }`, "values that aren't a dict"],
    [`spec = { items: ["a"] }`, "items alone"],
    [`spec = { a: 1, b: 2 }`, "an ordinary dict"],
    [`spec = [1, 2]`, "a list"],
    [`spec = 3`, "a number"],
  ])("%s isn't a candidate (%s)", async (code) => {
    const output = await run(code);
    const bindings = output.getBindings();
    if (!bindings.ok) throw new Error(bindings.value.toString());
    const value = bindings.value.get("spec");
    if (!value) throw new Error("no spec");
    expect(looksLikeRelativeValuesSpec(value)).toBe(false);
  });
});
