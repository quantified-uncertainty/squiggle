import { registry } from "../../src/library/registry";
import { allExamplesWithFns } from "../../src/library/registry/core";
import { evaluateStringToResult } from "../../src/reducer";

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
