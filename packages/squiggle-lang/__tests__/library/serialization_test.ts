import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("JSON", () => {
  testEvalToBe("Danger.json(1)", "1");
  testEvalToBe("Danger.json([1,2,3])", "[1,2,3]");
  testEvalToBe("Danger.json({foo: 'bar'})", '{foo: "bar"}');
});
