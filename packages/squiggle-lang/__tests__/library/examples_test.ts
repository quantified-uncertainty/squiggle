import { registry } from "../../src/library/registry/index.js";
import { allExamplesWithFns } from "../../src/library/registry/core.js";
import { evaluateStringToResult } from "../../src/reducer/index.js";

test.each(allExamplesWithFns(registry))(
  "tests of example $example",
  ({ fn, example }) => {
    const result = evaluateStringToResult(example);
    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Can't test type");
    }

    if (fn.output !== undefined) {
      expect(result.value.type).toEqual(fn.output);
    }
  }
);
