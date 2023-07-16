import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

describe("annotations", () => {
  describe(".parameters", () => {
    testEvalToBe("f(x: [3,5]) = x; List.length(f.parameters)", "1");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].name", "'x'");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].domain.min", "3");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].domain.max", "5");
  });

  describe("wrong annotation", () => {
    testEvalToBe("f(x: [3]) = x", "Error(Error: Expected two-value array)");
  });

  describe("runtime checks", () => {
    testEvalToBe("f(x: [3,5]) = x*2; f(3)", "6");
    testEvalToBe("f(x: [3,5]) = x*2; f(4)", "8");
    testEvalToBe("f(x: [3,5]) = x*2; f(5)", "10");
    testEvalToMatch(
      "f(x: [3,5]) = x*2; f(6)",
      "Parameter 6 must be in domain Range(3 to 5)"
    );
  });
});
