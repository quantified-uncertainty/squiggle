import { returnType } from "../helpers/analysisHelpers.js";

test("numbers", () => {
  expect(returnType("2")).toBe("Number");
});

test("strings", () => {
  expect(returnType("'foo'")).toBe("String");
});

test("booleans", () => {
  expect(returnType("true")).toBe("Bool");
});
