import { testToExpression } from "../helpers/reducerHelpers.js";

describe("Construct Array", () => {
  testToExpression("[1,2]", "[1, 2]", "[1,2]");
  testToExpression("[]", "[]", "[]");
  testToExpression(
    "f(x)=x; g(x)=x; [f, g]",
    "f = {|x| {x}}; g = {|x| {x}}; [f, g]",
    "[(x) => internal code,(x) => internal code]"
  );
});
