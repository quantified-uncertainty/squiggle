import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Danger functions", () => {
  describe("combinations", () => {
    testEvalToBe("Danger.combinations([3,5,8],0)", "[[]]");
    testEvalToBe("Danger.combinations([3,5,8],1)", "[[3], [5], [8]]");
    testEvalToBe("Danger.combinations([3,5,8],2)", "[[3, 5], [3, 8], [5, 8]]");
    testEvalToBe("Danger.combinations([3,5,8],3)", "[[3, 5, 8]]");
    testEvalToBe(
      "Danger.combinations([3,5,8],4)",
      "Error(Argument Error: Combinations of length 4 were requested, but full list is only 3 long.)"
    );
  });
  describe("allCombinations", () => {
    testEvalToBe(
      "Danger.allCombinations([3,5,8])",
      "[[3], [5], [8], [3, 5], [3, 8], [5, 8], [3, 5, 8]]"
    );
    testEvalToBe(
      "Danger.allCombinations([3,5,8])",
      "[[3], [5], [8], [3, 5], [3, 8], [5, 8], [3, 5, 8]]"
    );
    testEvalToBe("Danger.allCombinations([3])", "[[3]]");
    testEvalToBe("Danger.allCombinations([])", "[]");
  });
  describe("javascript", () => {
    testEvalToBe("Danger.parseFloat('10.0') + 1", "11");
    testEvalToBe("Danger.parseFloat('foo')", '"Parse Failed"');
  });
  describe("json", () => {
    testEvalToBe("Danger.json(1)", "1");
    testEvalToBe("Danger.json([1,2,3])", "[1, 2, 3]");
    testEvalToBe(
      "Danger.json({foo: 'bar'})",
      '{vtype: "Dict", value: {foo: "bar"}}'
    );
    testEvalToBe("Danger.jsonString([1,2,3])", '"[1,2,3]"');
    testEvalToBe(
      "Danger.jsonString(Scale.log({min:10, max: 20}))",
      '"{\\"vType\\":\\"Scale\\",\\"type\\":\\"log\\",\\"tickFormat\\":\\"\\",\\"title\\":\\"\\",\\"min\\":10,\\"max\\":20}"'
    );
  });
});
