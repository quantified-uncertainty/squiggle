import {
  testEvalToBe,
  testParse,
  testToExpression,
} from "../helpers/reducerHelpers";

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
