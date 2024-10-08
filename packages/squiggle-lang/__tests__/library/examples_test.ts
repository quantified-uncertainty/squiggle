import { getRegistry } from "../../src/library/registry/index.js";
import { evaluateStringToResult } from "../helpers/reducerHelpers.js";

test.each(
  getRegistry()
    .allExamplesWithFns()
    .filter(({ example }) => example.useForTests)
)("tests of example $example", async ({ fn, example }) => {
  const result = await evaluateStringToResult(example.text);

  if (!result.ok) {
    throw new Error(`Can't test type, with error: ${result.value}`);
  }

  expect(result.ok).toBe(true);
});
