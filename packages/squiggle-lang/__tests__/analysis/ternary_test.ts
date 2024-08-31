import { returnType } from "../helpers/analysisHelpers.js";

test("polymorphic ternary", () => {
  expect(returnType('true ? 1 : "foo"')).toBe("Number|String");
});

test("monomorphic ternary", () => {
  expect(returnType("true ? 1 : 2")).toBe("Number");
});

test("de-duped ternary", () => {
  expect(returnType("true ? 1 : (true ? 'foo' : 1)")).toBe("Number|String");
});
