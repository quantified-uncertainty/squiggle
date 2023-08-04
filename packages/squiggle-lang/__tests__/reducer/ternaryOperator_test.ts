import { testEvalToBe, testToExpression } from "../helpers/reducerHelpers.js";

describe("Parse ternary operator", () => {
  testToExpression("true ? 'YES' : 'NO'", 'true ? ("YES") : ("NO")');
});

describe("Evaluate ternary operator", () => {
  testEvalToBe("true ? 'YES' : 'NO'", '"YES"');
  testEvalToBe("false ? 'YES' : 'NO'", '"NO"');
  testEvalToBe("2 > 1 ? 'YES' : 'NO'", '"YES"');
  testEvalToBe("2 <= 1 ? 'YES' : 'NO'", '"NO"');
  testEvalToBe(
    "1+1 ? 'YES' : 'NO'",
    "Error(Expected type: Boolean but got: Number)"
  );
});
