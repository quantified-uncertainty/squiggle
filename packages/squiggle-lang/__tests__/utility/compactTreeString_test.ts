import { compactTreeString } from "../../src/utility/compactTreeString.js";
import {
  removeLambdas,
  SimpleValue,
  simpleValueFromAny,
  SimpleValueWithoutLambda,
} from "../../src/value/simpleValue.js";
import { testRun } from "../helpers/helpers.js";

async function runAndSummarize(code: string): Promise<string> {
  const result = await testRun(code);
  const simpleValue: SimpleValue = simpleValueFromAny(result.result.asJS());
  const withoutLambdas: SimpleValueWithoutLambda = removeLambdas(simpleValue);
  return compactTreeString(withoutLambdas, {
    maxDepth: 4,
    maxArrayItems: 4,
    maxDictItems: 4,
  });
}

describe("compactTreeString", () => {
  test("Simple array", () => {
    const result = compactTreeString([1, 2, 3, 4, 5]);
    expect(result).toBe("[1, 2, 3, 4, 5]");
  });

  test("Nested array", () => {
    const result = compactTreeString([1, [2, 3], 4, [5, 6]]);
    expect(result).toBe("[1, [2, 3], 4, [5, 6]]");
  });

  test("Nested object", async () => {
    const result = await runAndSummarize(`{a: {b: 1, c: 2}, d: [3, 4]}`);
    expect(result).toBe(`{
  vtype: "Dict",
  value: {
    a: {
      vtype: "Dict",
      value: {
        b: ...,
        c: ...
      }
    },
    d: [3, 4]
  }
}`);
  });

  test("Long array", async () => {
    const result = await runAndSummarize(
      `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]`
    );
    expect(result).toBe("[1, 2, 3, 4, ...15 total]");
  });

  test("Long object (hash)", async () => {
    const result = await runAndSummarize(
      `{a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11, l: 12, m: 13, n: 14, o: 15}`
    );
    expect(result).toBe(`{
  vtype: "Dict",
  value: {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    ...15 total
  }
}`);
  });

  test("complex object", async () => {
    const result = await runAndSummarize(
      `x = {foo: {bar: 1 to 5}}
          y = 5000 to 10000
          z(f) = f + 3
          {x,y,z}`
    );
    expect(result).toBe(`{
  vtype: "Dict",
  value: {
    x: {
      vtype: "Dict",
      value: {
        foo: ...
      }
    },
    y: {
      vType: "SampleSetDist",
      samples: [10400, 6830, 5280, 7700, ...1000 total],
      summary: {
        mean: ...,
        p5: ...,
        p50: ...,
        p95: ...
      }
    },
    z: {
      vType: "Lambda",
      toString: "(f) => internal code",
      paramenterString: "f"
    }
  }
}`);
  });
});
