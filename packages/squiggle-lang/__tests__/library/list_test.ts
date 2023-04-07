import { testEvalError, testEvalToBe } from "../helpers/reducerHelpers.js";

describe("List functions", () => {
  describe("lookup", () => {
    testEvalToBe("[3,5,8][1.8]", "Error(Array index must be an integer: 1.8)");
    testEvalToBe("[3,5,8][0/0]", "Error(Array index must be an integer: NaN)");
    testEvalToBe("[3,5,8][2]", "8");
  });

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
  describe("concat", () => {
    testEvalToBe("List.concat([1, 2, 3], [4, 5, 6])", "[1,2,3,4,5,6]");
    testEvalToBe("List.concat([], [1, 2, 3])", "[1,2,3]");
    testEvalToBe("List.concat(['cake'], [1, 2, 3])", "['cake',1,2,3]");
  });

  describe("reverse", () => {
    testEvalToBe("List.reverse([3,5,8])", "[8,5,3]");
    testEvalToBe("List.reverse([])", "[]");
  });

  describe("append", () => {
    testEvalToBe("List.append([3,5,8], 8)", "[3,5,8,8]");
    testEvalToBe("List.append([], 8)", "[8]");
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

  describe("uniq", () => {
    testEvalToBe("arr=[1,2,3,1,2,3]; List.uniq(arr)", "[1,2,3]");
    testEvalToBe("arr=[1,'1']; List.uniq(arr)", "[1,'1']");
    testEvalToBe(
      "arr=[1,1, 'test', 'test', false, false, true]; List.uniq(arr)",
      "[1,'test',false,true]"
    );
    testEvalToBe(
      "arr=[1,2,normal(50,1)]; List.uniq(arr)",
      "Error(Error: Can only apply uniq() to Strings, Numbers, or Bools)"
    );
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

  describe("join", () => {
    testEvalToBe("arr=['a', 'b', 'c']; List.join(arr, '-')", "'a-b-c'");
    testEvalToBe("arr=['a', 'b', 'c']; List.join(arr, ' ')", "'a b c'");
    testEvalToBe("arr=['a', 'b', 'c']; List.join(arr)", "'a,b,c'");
  });

  describe("flatten", () => {
    testEvalToBe("List.flatten([[1,2], [3,4]])", "[1,2,3,4]");
    testEvalToBe("List.flatten([[1,2], [3,[4,5]]])", "[1,2,3,[4,5]]");
  });
});
