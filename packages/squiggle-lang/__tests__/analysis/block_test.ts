import { returnType } from "../helpers/analysisHelpers.js";

test("block", () => {
  expect(returnType("{ x = 1; y = 'foo'; x }")).toBe("Number");
});
