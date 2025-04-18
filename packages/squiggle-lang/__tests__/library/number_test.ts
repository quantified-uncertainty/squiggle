import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Numbers", () => {
  testEvalToBe("Number.floor(5.5)", "5");
  testEvalToBe("Number.ceil(5.5)", "6");
  testEvalToBe("floor(5.5)", "5");
  testEvalToBe("ceil(5.5)", "6");
  testEvalToBe("Number.abs(5.5)", "5.5");
  testEvalToBe("Number.abs(-5.5)", "5.5");
  testEvalToBe("Number.abs(0)", "0");
  testEvalToBe("abs(5.5)", "5.5");
  testEvalToBe("Number.exp(10)", "22026.465794806718");
  testEvalToBe("Number.log10(10)", "1");
  testEvalToBe("Number.log2(10)", "3.321928094887362");
  testEvalToBe("Number.sum([])", "0");
  testEvalToBe("Number.sum([2,5,3])", "10");
  testEvalToBe("sum([])", "0");
  testEvalToBe("sum([2,5,3])", "10");
  testEvalToBe("Number.product([])", "1");
  testEvalToBe("Number.product([2,5,3])", "30");
  testEvalToBe("Number.min([2,5,3])", "2");
  testEvalToBe("Number.max([2,5,3])", "5");
  testEvalToBe("Number.mean([0,5,10])", "5");
  testEvalToBe("Number.geomean([1,5,18])", "4.481404746557164");
  testEvalToBe("Number.stdev([0,5,10,15])", "5.5901699437494745");
  testEvalToBe("Number.variance([0,5,10,15])", "31.25");
  testEvalToBe("Number.quantile([0,5,10,15,20], 0.25)", "5");
  testEvalToBe("Number.median([0,5,10,15,20])", "10");
  testEvalToBe("Number.sort([])", "[]");
  testEvalToBe("Number.sort([10,0,15,5])", "[0, 5, 10, 15]");
  testEvalToBe("Number.cumsum([])", "[]");
  testEvalToBe("Number.cumsum([1,5,3])", "[1, 6, 9]");
  testEvalToBe("Number.cumprod([])", "[]");
  testEvalToBe("Number.cumprod([1,5,3])", "[1, 5, 15]");
  testEvalToBe("Number.diff([1])", "[]");
  testEvalToBe("Number.diff([1,5,3])", "[4, -2]");
  testEvalToBe("Number.mod(10, 3)", "1");
  testEvalToBe("mod(10, 3)", "1");
  testEvalToBe("Number.mod(15, 4)", "3");
  testEvalToBe("mod(-10, 3)", "2");
  testEvalToBe("mod(-5, 3)", "1");
  testEvalToBe("mod(5, -3)", "-1");
  testEvalToBe("mod(-5, -3)", "-2");
});

describe("Operators", () => {
  testEvalToBe("2 + 3", "5");

  // https://github.com/quantified-uncertainty/squiggle/issues/1336
  testEvalToBe("add(x, y) = x * y; 2 + 3", "5");
});
