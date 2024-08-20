import { returnType } from "../helpers/analysisHelpers.js";

test("dict with static keys", () => {
  expect(returnType("{ foo: 1 }")).toBe("{foo: Number}");
});

test("dict with dynamic keys", () => {
  expect(returnType("f() = 1; { f(): 1 }")).toBe("Dict(any)");
});

test("lookup constant keys", () => {
  expect(returnType("d = { foo: 1 }; d.foo")).toBe("Number");
});

test("lookup non-existent key", () => {
  expect(() => returnType("{ foo: 1 }.bar")).toThrow(
    "Key bar doesn't exist in dict {foo: Number}"
  );
});
