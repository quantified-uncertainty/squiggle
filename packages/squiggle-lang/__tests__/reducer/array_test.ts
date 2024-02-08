import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Array", () => {
  testEvalToBe("[1, 2]", "[1,2]");
  testEvalToBe("[]", "[]");
  testEvalToBe(
    "f(x)=x; g(x)=x; [f, g]",
    "[(x) => internal code,(x) => internal code]"
  );
});
