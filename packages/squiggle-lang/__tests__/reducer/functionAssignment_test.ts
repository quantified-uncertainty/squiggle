import { MySkip, testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Basic declarations", () => {
  testEvalToBe("f(x)=x; f", "(x) => internal code");
  testEvalToBe("f(x)=2*x; f", "(x) => internal code");
});

describe("Evaluate function assignment", () => {
  testEvalToBe("f(x)=x; f(1)", "1");
});

describe("Shadowing", () => {
  testEvalToBe("x = 5; f(y) = x*y; x = 6; f(2)", "10");
});

describe("Shadowing builtins", () => {
  // TODO, https://github.com/quantified-uncertainty/squiggle/issues/1336
  MySkip.testEvalToBe("add(x, y) = x * y; 2 + 3", "5");
});
