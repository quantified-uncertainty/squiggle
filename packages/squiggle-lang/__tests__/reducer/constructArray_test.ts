import { testToExpression } from "../helpers/reducerHelpers";

describe("Construct Array", () => {
  testToExpression("[1,2]", "[1, 2]", "[1,2]");
  testToExpression("[]", "[]", "[]");
  testToExpression(
    "f(x)=x; g(x)=x; [f, g]",
    "f = {|x| {x}}; g = {|x| {x}}; [f, g]",
    "[lambda(x=>internal code),lambda(x=>internal code)]"
  );
});
