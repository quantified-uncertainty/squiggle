import { returnType } from "../helpers/analysisHelpers.js";

test("list of numbers", () => {
  expect(returnType("[1, 2, 3]")).toBe("List(Number)");
});

test("union of all possible types", () => {
  expect(returnType("[1, 'foo']")).toBe("List(Number|String)");
});

test("de-duped union", () => {
  expect(returnType("[1, 'foo', 2]")).toBe("List(Number|String)");
});
