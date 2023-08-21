import { testEvalToBe } from "../helpers/reducerHelpers.js";

// TODO - it'd be useful to do most of `./sym_test.ts` tests here, without `Sym.` prefix
describe("Dist operations", () => {
  describe("Power on negative samples", () => {
    // ok when power is integer
    testEvalToBe("normal(-100, 1) ^ 2", "Sample Set Distribution");
    // fails when power is not an integer
    testEvalToBe(
      "normal(-100, 1) ^ 2.5",
      "Error(Distribution Math Error: Operation returned complex result)"
    );
  });
});
