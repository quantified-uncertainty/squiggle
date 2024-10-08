import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Math Library", () => {
  testEvalToBe("Math.e", "2.718281828459045");
  testEvalToBe("Math.pi", "3.141592653589793");
  testEvalToBe("Number.maxValue", Number.MAX_VALUE.toString());
  testEvalToBe("Number.minValue", Number.MIN_VALUE.toString());
});
