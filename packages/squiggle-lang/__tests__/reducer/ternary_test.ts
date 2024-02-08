import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Evaluate ternary operator", () => {
  testEvalToBe("true ? 'YES' : 'NO'", '"YES"');
  testEvalToBe("false ? 'YES' : 'NO'", '"NO"');
  testEvalToBe("2 > 1 ? 'YES' : 'NO'", '"YES"');
  testEvalToBe("2 <= 1 ? 'YES' : 'NO'", '"NO"');
  testEvalToBe(
    "1+1 ? 'YES' : 'NO'",
    "Error(Expected type: Boolean but got: Number)"
  );
  testEvalToBe("true ? 1 : 0", "1");
  testEvalToBe("false ? 1 : 0", "0");

  // nested ternary
  testEvalToBe("true ? 1 : false ? 2 : 0", "1");
  testEvalToBe("false ? 1 : false ? 2 : 0", "0");

  // in functions
  // I'm not sure what these tests are for, they were separated from the AST -> Expression tests
  testEvalToBe("f(a) = a > 5 ? 1 : 0; f(6)", "1");
  testEvalToBe("f(a) = a > 5 ? a : 0; f(6)", "6");
  testEvalToBe("f(a) = a < 5 ? 1 : a; f(6)", "6");
});
