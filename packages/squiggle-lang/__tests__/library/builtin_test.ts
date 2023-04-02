import { testEvalError, testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Operators", () => {
  describe("equal", () => {
    testEvalToBe("3 == 5", "false");
    testEvalToBe("3 == 3", "true");
    testEvalToBe("3 == 5", "false");
    testEvalToBe('"foo" == "bar"', "false");
    testEvalToBe('"foo" == "foo"', "true");
  });
});
