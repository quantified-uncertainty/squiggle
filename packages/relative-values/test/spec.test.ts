import { describe, expect, test } from "@jest/globals";

import { run } from "@quri/squiggle-lang";

import {
  findRelativeValuesExports,
  looksLikeRelativeValuesSpec,
  relativeValuesSpecFromCode,
  relativeValuesSpecFromSqValue,
} from "../src/index.js";
import { readExample } from "./helpers.js";

async function getValue(code: string, name: string) {
  const output = await run(code);
  const bindings = output.getBindings();
  if (!bindings.ok) {
    throw new Error(bindings.value.toString());
  }
  const value = bindings.value.get(name);
  if (!value) {
    throw new Error(`${name} not found`);
  }
  return value;
}

async function parse(code: string, name = "spec") {
  return relativeValuesSpecFromSqValue(await getValue(code, name), {
    variableName: name,
  });
}

describe("relativeValuesSpecFromSqValue", () => {
  test("fn form", async () => {
    const result = await parse(`
dists = { a: 1, b: 2 to 5 }
spec = {
  title: "My spec",
  items: [{ id: "a", name: "A", clusterId: "c1" }, { id: "b", description: "B!" }],
  clusters: [{ id: "c1", name: "Cluster 1", color: "#ff0000" }],
  recommendedUnit: "a",
  fn: {|x, y| [dists[x], dists[y]]},
}`);
    if (!result.ok) throw new Error(result.value);
    const spec = result.value;
    expect(spec.comparison.type).toBe("fn");
    expect(spec.variableName).toBe("spec");
    expect(spec.definition).toEqual({
      title: "My spec",
      items: [
        { id: "a", name: "A", clusterId: "c1", description: "" },
        { id: "b", name: "b", clusterId: null, description: "B!" },
      ],
      clusters: [
        {
          id: "c1",
          name: "Cluster 1",
          color: "#ff0000",
          recommendedUnit: null,
        },
      ],
      recommendedUnit: "a",
    });
  });

  test("values form derives items from keys", async () => {
    const result = await parse(`spec = { values: { x: 1, y: 2 to 3 } }`);
    if (!result.ok) throw new Error(result.value);
    expect(result.value.comparison.type).toBe("values");
    expect(result.value.definition.items.map((item) => item.id)).toEqual([
      "x",
      "y",
    ]);
    expect(result.value.definition.title).toBe("spec");
  });

  test("string items", async () => {
    const result = await parse(
      `spec = { items: ["x"], values: { x: 1, y: 2 } }`
    );
    if (!result.ok) throw new Error(result.value);
    expect(result.value.definition.items).toEqual([
      { id: "x", name: "x", clusterId: null, description: "" },
    ]);
  });

  test("undeclared clusters are created automatically", async () => {
    const result = await parse(
      `spec = { items: [{id: "x", clusterId: "foo"}], values: { x: 1 } }`
    );
    if (!result.ok) throw new Error(result.value);
    expect(result.value.definition.clusters).toMatchObject([
      { id: "foo", color: expect.any(String) },
    ]);
  });

  test.each([
    [`spec = 5`, "must be a dict"],
    [`spec = { items: [{id: "a"}] }`, `either "fn" or "values"`],
    [`spec = { fn: {|a, b| [1, 2]} }`, `"items" is required`],
    [`spec = { items: [{id: "a"}], fn: {|a| [1, 2]} }`, "two arguments"],
    [
      `spec = { items: [{name: "a"}], fn: {|a, b| [1, 2]} }`,
      `"id" is required`,
    ],
    [`spec = { items: ["a", "a"], fn: {|a, b| [1, 2]} }`, "Duplicate item id"],
    [`spec = { values: { a: "foo" } }`, "values.a must be"],
    [
      `spec = { items: ["a", "z"], values: { a: 1 } }`,
      'missing from "values": z',
    ],
    [
      `spec = { items: ["a"], values: { a: 1 }, recommendedUnit: "q" }`,
      "is not an item id",
    ],
  ])("error: %s", async (code, message) => {
    const result = await parse(code);
    expect(result.ok).toBe(false);
    expect(result.value).toContain(message);
  });
});

describe("looksLikeRelativeValuesSpec", () => {
  test.each([
    [`spec = { items: [], fn: {|a, b| [1, 2]} }`, true],
    [`spec = { values: { a: 1, b: 2 to 3 } }`, true],
    [`spec = { values: { a: 1 } }`, false],
    [`spec = { values: { a: 1, b: "x" } }`, false],
    [`spec = { fn: {|a, b| [1, 2]} }`, false],
    [`spec = 3`, false],
  ])("%s", async (code, expected) => {
    expect(looksLikeRelativeValuesSpec(await getValue(code, "spec"))).toBe(
      expected
    );
  });
});

describe("findRelativeValuesExports", () => {
  test("finds specs in bindings", async () => {
    const output = await run(`
a = { values: { x: 1, y: 2 } }
b = 5
c = { items: ["x"], fn: {|p, q| [1, 2]}, recommendedUnit: "nope" }
export d = { values: { x: 1, y: 2 to 3 } }
`);
    const found = findRelativeValuesExports(output);
    expect(found.map((e) => [e.name, e.spec.ok])).toEqual([
      ["a", true],
      ["c", false],
      ["d", true],
    ]);

    const exports = output.getExports();
    if (!exports.ok) throw new Error("no exports");
    expect(findRelativeValuesExports(exports.value).map((e) => e.name)).toEqual(
      ["d"]
    );
  });

  test.each([
    ["quri.squiggle", "quriProjects", 24, "fn"],
    ["health-interventions.squiggle", "healthInterventions", 38, "values"],
    ["minimal.squiggle", "fruit", 3, "values"],
  ])("example %s", async (file, name, itemCount, type) => {
    const output = await run(readExample(file));
    const found = findRelativeValuesExports(output);
    expect(found.map((e) => e.name)).toEqual([name]);
    const spec = found[0].spec;
    if (!spec.ok) throw new Error(spec.value);
    expect(spec.value.definition.items.length).toBe(itemCount);
    expect(spec.value.comparison.type).toBe(type);
  });
});

test("relativeValuesSpecFromCode", async () => {
  const result = await relativeValuesSpecFromCode(
    readExample("minimal.squiggle"),
    "fruit"
  );
  expect(result.ok).toBe(true);
  const missing = await relativeValuesSpecFromCode("x = 1", "y");
  expect(missing.ok).toBe(false);
});
