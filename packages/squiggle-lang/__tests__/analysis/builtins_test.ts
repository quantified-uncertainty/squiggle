import { returnType } from "../helpers/analysisHelpers.js";

test("builtin constants", () => {
  expect(returnType("Math.pi")).toBe("Number");
});

test("builtin functions", () => {
  expect(returnType("System.sampleCount")).toBe("() => Number");
});
