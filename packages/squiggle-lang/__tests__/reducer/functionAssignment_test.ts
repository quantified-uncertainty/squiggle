import {
  MySkip,
  testEvalToBe,
  testToExpression,
} from "../helpers/reducerHelpers.js";

describe("Parse function assignment", () => {
  testToExpression("f(x)=x", "f = {|x| {x}}");
  testToExpression("f(x)=2*x", "f = {|x| {(multiply)(2, x)}}");
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
