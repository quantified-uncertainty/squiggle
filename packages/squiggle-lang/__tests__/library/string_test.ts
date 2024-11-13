import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Strings", () => {
  testEvalToBe("String.make(1234567.382, '.2f')", '"1234567.38"');
  testEvalToBe(
    "String.make(Date.make(2020, 5, 12), '%Y-%m-%d')",
    '"2020-05-12"'
  );
});
