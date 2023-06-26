import { registry } from "../../src/library/registry/index.js";
import { evaluateStringToResult } from "../../src/reducer/index.js";

test.each(registry.allExamplesWithFns())(
  "tests of example $example",
  async ({ fn, example }) => {
    const result = await evaluateStringToResult(example);
    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Can't test type");
    }

    if (fn.output !== undefined) {
      expect(result.value.type).toEqual(fn.output);
    }
  }
);
