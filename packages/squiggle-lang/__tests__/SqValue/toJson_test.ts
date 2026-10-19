import { sqValueToJson } from "../../src/public/SqValue/toJson.js";
import { run } from "../../src/run.js";

async function evalToJson(code: string, samples?: number) {
  const output = await run(code);
  if (!output.result.ok) {
    throw new Error(output.result.value.toString());
  }
  return sqValueToJson(output.result.value.result, { samples });
}

describe("sqValueToJson", () => {
  test("primitives", async () => {
    expect(await evalToJson("1")).toBe(1);
    expect(await evalToJson('"a"')).toBe("a");
    expect(await evalToJson("true")).toBe(true);
    expect(await evalToJson("[1, {a: 2}]")).toEqual([1, { a: 2 }]);
  });

  test("dist summary", async () => {
    const json = await evalToJson("Sym.uniform(0, 10)");
    expect(json).toMatchObject({
      type: "Dist",
      subtype: "Symbolic",
      mean: 5,
      p50: 5,
      min: 0,
      max: 10,
    });
  });

  test("samples are opt-in", async () => {
    const json = (await evalToJson("normal(0, 1)", 3)) as {
      samples: number[];
    };
    expect(json.samples).toHaveLength(3);
  });
});
