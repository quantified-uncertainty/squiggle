import { describe, expect, test } from "vitest";

import { SqModule } from "@quri/squiggle-lang";

import { semanticKey } from "../src/client/views/rv/semanticKey.js";

// QA #15: the relative values pair cache is keyed by what the model computes,
// so comment and whitespace edits reuse every pair; any value edit changes
// the key.

const key = (code: string, name = "models/fruit.squiggle") =>
  semanticKey(new SqModule({ name, code }));

const base = `// Fruit, valued in apples.
fruit = {
  values: {
    apple: 1,
    banana: 0.5 to 2,
    mango: 2 to 6,
  },
  recommendedUnit: "apple",
}
`;

describe("semanticKey", () => {
  test.each([
    ["a comment edit", base.replace("valued in apples", "valued in kiwis")],
    ["a new comment", `// A note\n${base}`],
    [
      "a trailing comment",
      base.replace("mango: 2 to 6,", "mango: 2 to 6, // ripe"),
    ],
    ["a block comment", base.replace("apple: 1,", "apple: 1, /* the unit */")],
    ["indentation", base.replace(/\n {4}/g, "\n      ")],
    ["blank lines", base.replace("\nfruit", "\n\n\nfruit")],
    ["spaces in expressions", base.replace("0.5 to 2", "0.5   to   2")],
    ["a trailing newline", base + "\n\n"],
  ])("keeps the key for %s", (_name, edited) => {
    expect(key(edited)).toBe(key(base));
  });

  test.each([
    ["a value", base.replace("2 to 6", "2 to 7")],
    ["a number literal", base.replace("apple: 1,", "apple: 2,")],
    ["an item id", base.replace("banana", "plantain")],
    ["a string", base.replace('"apple"', '"mango"')],
    ["a new binding", `${base}x = 1\n`],
    ["the variable name", base.replace("fruit =", "fruits =")],
    ["a decorator", `@name("Fruit")\n${base}`],
    ["an import", `import "./lib.squiggle" as lib\n${base}`],
  ])("changes the key for %s", (_name, edited) => {
    expect(key(edited)).not.toBe(key(base));
  });

  test("ignores the module name (locations carry it)", () => {
    expect(key(base, "a.squiggle")).toBe(key(base, "b/c.squiggle"));
  });

  test("a module that doesn't parse is keyed by its code", () => {
    const broken = "fruit = { values: {";
    expect(key(broken)).toMatch(/^code:/);
    expect(key(broken)).toBe(key(broken));
    expect(key(broken + " ")).not.toBe(key(broken));
    expect(key(base)).toMatch(/^ast:/);
  });
});
