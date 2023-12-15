import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("JSON", () => {
  testEvalToBe("JSON(1)", "1");
  testEvalToBe("JSON([1,2,3])", "[1,2,3]");
  testEvalToBe("JSON({foo: 'bar'})", '{foo: "bar"}');
});
