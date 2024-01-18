import { registry } from "../../src/library/registry/index.js";
import { evaluateStringToResult } from "../../src/reducer/index.js";

test.each(
  registry.allExamplesWithFns().filter(({ example }) => example.useForTests)
)("tests of example $example", async ({ fn, example }) => {
  const result = await evaluateStringToResult(example.text);

  if (!result.ok) {
    throw new Error(`Can't test type, with error: ${result.value}`);
  }

  if (fn.output !== undefined) {
    expect(result.value.type).toEqual(fn.output);
  }

  expect(result.ok).toBe(true);
});
