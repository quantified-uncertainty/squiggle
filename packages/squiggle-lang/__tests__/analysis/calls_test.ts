import { returnType } from "../helpers/analysisHelpers.js";

test("call wrong type", () => {
  expect(() =>
    returnType(`
x = 1
y = x(1)
`)
  ).toThrow(/^Number is not a function/);
});

test("infix calls", () => {
  expect(returnType("2 + 2")).toBe("Number");
  expect(returnType("2 + (3 to 4)")).toBe("Dist");
});

test("function calls", () => {
  expect(returnType("System.sampleCount()")).toBe("Number");
});

test("single signature builtin arity", () => {
  expect(() => returnType("System.sampleCount(1)")).toThrow(
    "0 arguments expected. Instead 1 argument(s) were passed."
  );
});

test("polymorphic builtin arity with single arity", () => {
  expect(() => returnType("map([1,2,3], 1,2,3)")).toThrow(
    /^2 arguments expected\. Instead 4 argument\(s\) were passed\./
  );
});

test("polymorphic builtin arity with multiple arities", () => {
  expect(() => returnType("Sym.normal(1,2,3)")).toThrow(
    /^1-2 arguments expected\. Instead 3 argument\(s\) were passed\./
  );
});

test("function output type based on polymorphic end expression", () => {
  expect(
    returnType(`
{
  f(x) = x + 1
  f(1)
}`)
  ).toBe("Number|Dist|String"); // TODO - ideally, Squiggle should filter out `String` here.
});

test("polymorphic builtin functions", () => {
  expect(returnType("lognormal(1, 100)")).toBe("SampleSetDist");
});

test("pipe", () => {
  expect(returnType("1 -> lognormal(100)")).toBe("SampleSetDist");
});

// generics are not implemented yet
test.failing("generic return type", () => {
  expect(returnType("List.map([1,2,3], {|x|x})")).toBe("List(Number)");
});
