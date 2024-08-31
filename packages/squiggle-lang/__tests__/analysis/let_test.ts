import { returnType } from "../helpers/analysisHelpers.js";

test("let", () => {
  expect(returnType("x = 2; x")).toBe("Number");
  expect(returnType("x = 2; y = x; y")).toBe("Number");
});
