import { testEvalToBe } from "../helpers/reducerHelpers.js";

// Testing the Danger functions
describe("Danger functions", () => {
  // Testing the combinations function
  describe("combinations", () => {
    // Testing the combinations function with a list of 3 elements and a combination length of 0
    testEvalToBe("Danger.combinations([3,5,8],0)", "[[]]");
    // Testing the combinations function with a list of 3 elements and a combination length of 1
    testEvalToBe("Danger.combinations([3,5,8],1)", "[[3],[5],[8]]");
    // Testing the combinations function with a list of 3 elements and a combination length of 2
    testEvalToBe("Danger.combinations([3,5,8],2)", "[[3,5],[3,8],[5,8]]");
    // Testing the combinations function with a list of 3 elements and a combination length of 3
    testEvalToBe("Danger.combinations([3,5,8],3)", "[[3,5,8]]");
    // Testing the combinations function with a list of 3 elements and a combination length of 4
    testEvalToBe(
      "Danger.combinations([3,5,8],4)",
      "Error(Argument Error: Combinations of length 4 were requested, but full list is only 3 long.)"
    );
  });
  // Testing the allCombinations function
  describe("allCombinations", () => {
    // Testing the allCombinations function with a list of 3 elements
    testEvalToBe(
      "Danger.allCombinations([3,5,8])",
      "[[3],[5],[8],[3,5],[3,8],[5,8],[3,5,8]]"
    );
    // Testing the allCombinations function with a list of 3 elements
    testEvalToBe(
      "Danger.allCombinations([3,5,8])",
      "[[3],[5],[8],[3,5],[3,8],[5,8],[3,5,8]]"
    );
    // Testing the allCombinations function with a list of 1 element
    testEvalToBe("Danger.allCombinations([3])", "[[3]]");
    // Testing the allCombinations function with an empty list
    testEvalToBe("Danger.allCombinations([])", "[]");
  });
});
