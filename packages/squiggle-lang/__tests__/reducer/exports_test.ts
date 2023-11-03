import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

describe("Exports Array", () => {
  testEvalToMatch(
    "x = { export y = 1; 2 }",
    "Exports aren't allowed in blocks"
  );
  testEvalToBe("export x = 5; y = 6; x + y", "11");
});
