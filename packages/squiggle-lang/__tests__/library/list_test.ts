import { testEvalError, testEvalToBe } from "../helpers/reducerHelpers";

describe("List functions", () => {
  describe("length", () => {
    testEvalToBe("List.length([3,5,8])", "3");
    testEvalToBe("List.length([])", "0");
    testEvalError('List.length("abc")');
  });

  describe("make", () => {
    testEvalToBe("List.make(3, 'HI')", "['HI','HI','HI']");
    testEvalToBe("make(3, 'HI')", "Error(make is not defined)");
  });

  describe("upTo", () => {
    testEvalToBe("List.upTo(1,3)", "[1,2,3]");
    // TODO - test fractional values
    // TODO - test low > high condition
  });

  describe("first", () => {
    testEvalToBe("List.first([3,5,8])", "3");
    // TODO - test on empty arrays
  });

  describe("last", () => {
    testEvalToBe("List.last([3,5,8])", "8");
    // TODO - test on empty arrays
  });

  describe("reverse", () => {
    testEvalToBe("List.reverse([3,5,8])", "[8,5,3]");
    // TODO - test on empty arrays
  });

  describe("map", () => {
    testEvalToBe("arr=[1,2,3]; map(arr, {|x| x*2})", "[2,4,6]");
    testEvalToBe(
      "double(x)=2*x; arr=[1,2,3]; List.map(arr, double)",
      "[2,4,6]"
    );
    testEvalToBe("double(x)=2*x; arr=[1,2,3]; map(arr, double)", "[2,4,6]");

    // wrong arg types
    testEvalError("addone(x)=x+1; map(2, addone)");
    testEvalError("addone(x)=x+1; map(2, {x: addone})");
  });

  describe("reduce", () => {
    testEvalToBe(
      "myadd(acc,x)=acc+x; arr=[1,2,3]; List.reduce(arr, 0, myadd)",
      "6"
    );
    testEvalToBe(
      "change(acc,x)=acc*x+x; arr=[1,2,3]; List.reduce(arr, 0, change)",
      "15"
    );
    testEvalToBe(
      "change(acc,x)=acc*x+x; arr=[1,2,3]; List.reduceReverse(arr, 0, change)",
      "9"
    );
  });
  describe("reverse", () => {
    testEvalToBe("arr=[1,2,3]; List.reverse(arr)", "[3,2,1]");
  });

  describe("filter", () => {
    testEvalToBe("check(x)=(x==2);arr=[1,2,3]; List.filter(arr,check)", "[2]");
  });
});
