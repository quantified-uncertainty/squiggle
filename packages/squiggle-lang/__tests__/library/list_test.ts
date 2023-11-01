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
    testEvalToBe("List.make(3, 'HI')", '["HI","HI","HI"]');
    testEvalToBe("List.make(3, {|e| e})", "[0,1,2]");
    testEvalToBe("List.make(3, {|| 1})", "[1,1,1]");
    testEvalToBe("List.make(3, {|index| 1 + index})", "[1,2,3]");
    testEvalToBe(
      "List.make(3.5, 'HI')",
      "Error(Argument Error: Number must be an integer)"
    );
    testEvalToBe(
      "List.make(-4, 'HI')",
      "Error(Argument Error: Expected non-negative number)"
    );
    testEvalToBe("make(3, 'HI')", "Error(make is not defined)");
  });

  describe("upTo", () => {
    testEvalToBe("List.upTo(1,3)", "[1,2,3]");
    testEvalToBe(
      "List.upTo(1.5,3)",
      "Error(Argument Error: Low and high values must both be integers)"
    );
    // TODO - test low > high condition
  });

  describe("first", () => {
    testEvalToBe("List.first([3,5,8])", "3");
    testEvalToBe(
      "List.first([])",
      "Error(Argument Error: List must not be empty)"
    );
  });

  describe("last", () => {
    testEvalToBe("List.last([3,5,8])", "8");
    testEvalToBe(
      "List.last([])",
      "Error(Argument Error: List must not be empty)"
    );
  });
  describe("concat", () => {
    testEvalToBe("List.concat([1, 2, 3], [4, 5, 6])", "[1,2,3,4,5,6]");
    testEvalToBe("List.concat([], [1, 2, 3])", "[1,2,3]");
    testEvalToBe("List.concat(['cake'], [1, 2, 3])", '["cake",1,2,3]');
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

    // two-arg callback
    testEvalToBe("[10,20,30] -> List.map({|x,i|x+i+1})", "[11,22,33]");
    testEvalToBe("List.map([[1]], Number.sum)", "[1]");
  });

  describe("slice", () => {
    testEvalToBe("List.slice([1,2,3,4,5,6], 2)", "[3,4,5,6]");
    testEvalToBe("List.slice([1,2,3,4,5,6], 2, 4)", "[3,4]");
    testEvalToBe("List.slice([1,2,3,4,5,6], 8, 3)", "[]");
    testEvalToBe("List.slice([], 8, 3)", "[]");
    testEvalToBe("List.slice([1,2,3,4,5,6], -4)", "[3,4,5,6]");
    testEvalToBe("List.slice([1,2,3,4,5,6], 2, -1)", "[3,4,5]");
    testEvalToBe(
      "List.slice([], 3.5, 3)",
      "Error(Argument Error: Number 3.5 must be an integer)"
    );
  });

  describe("uniq", () => {
    testEvalToBe("arr=[1,2,3,1,2,3]; List.uniq(arr)", "[1,2,3]");
    testEvalToBe("arr=[1,'1']; List.uniq(arr)", '[1,"1"]');
    testEvalToBe(
      "arr=[1,1, 'test', 'test', false, false, true]; List.uniq(arr)",
      '[1,"test",false,true]'
    );
    testEvalToBe(
      "arr=[1,2,normal(50,1)]; List.uniq(arr)",
      "[1,2,Sample Set Distribution]"
    );
  });

  describe("uniqBy", () => {
    testEvalToBe(
      "arr=[1.2, 1.6, 2.3, 2.8]; List.uniqBy(arr, floor)",
      "[1.2,2.3]"
    );
    testEvalToBe(
      "arr=[{a: 1, b: 2}, {a: 1, b: 3}, {a:2, b:5}]; List.uniqBy(arr, {|e| e.a})",
      "[{a: 1,b: 2},{a: 2,b: 5}]"
    );
    testEvalToBe(
      "arr=[{a: normal(5,2), b: 2}, {a: 1, b: 3}, {a:2, b:5}]; List.uniqBy(arr, {|e| e.a})",
      "[{a: Sample Set Distribution,b: 2},{a: 1,b: 3},{a: 2,b: 5}]"
    );
    testEvalToBe(
      "arr=[{a: normal(5,2), b: 2}, {a: 1, b: 3}, {a:2, b:3}]; List.uniqBy(arr, {|e| e.b})",
      "[{a: Sample Set Distribution,b: 2},{a: 1,b: 3}]"
    );
  });

  describe("reduce", () => {
    testEvalToBe(
      "myadd(acc,x)=acc+x; arr=[1,2,3]; List.reduce(arr, 0, myadd)",
      "6"
    );
    testEvalToBe("List.reduce([1,2,3], 0, add)", "6");
    testEvalToBe(
      "change(acc,x)=acc*x+x; arr=[1,2,3]; List.reduce(arr, 0, change)",
      "15"
    );
    testEvalToBe(
      "change(acc,x)=acc*x+x; arr=[1,2,3]; List.reduceReverse(arr, 0, change)",
      "9"
    );
    testEvalToBe(
      "myadd(acc,x,index)=acc+x+index; arr=[1,2,3]; List.reduce(arr, 0, myadd)",
      "9"
    );
  });

  describe("reduceWhile", () => {
    // basic
    testEvalToBe(
      "List.reduceWhile([5, 6, 7], 0, {|acc, curr| acc + curr}, {|acc| acc < 12})",
      "11"
    );

    // non-trivial init value
    testEvalToBe(
      "List.reduceWhile([5, 6, 7], 10, {|acc, curr| acc + curr}, {|acc| acc < 23})",
      "21"
    );

    // acc has a different type from array elements
    testEvalToBe(
      "List.reduceWhile([5, 6, 7], { x: 0 }, {|acc, curr| { x: acc.x + curr }}, {|acc| acc.x < 13})",
      "{x: 11}"
    );

    // stop before the first element
    testEvalToBe(
      "List.reduceWhile([5, 6, 7], 10, {|acc, curr| acc + curr}, {|acc| acc < 5})",
      "10"
    );

    // don't stop until the end
    testEvalToBe(
      "List.reduceWhile([5, 6, 7], 0, {|acc, curr| acc + curr}, {|acc| acc < 100})",
      "18"
    );

    // empty list
    testEvalToBe(
      "List.reduceWhile([], 5, {|acc, curr| acc + curr}, {|acc| acc < 10})",
      "5"
    );

    // empty list, intiial value doesn't fit the condition
    testEvalToBe(
      "List.reduceWhile([], 5, {|acc, curr| acc + curr}, {|acc| acc < 0})",
      "5"
    );
  });

  describe("reverse", () => {
    testEvalToBe("arr=[1,2,3]; List.reverse(arr)", "[3,2,1]");
  });

  describe("filter", () => {
    testEvalToBe("arr=[1,2,3]; List.filter(arr,{|e| e > 1})", "[2,3]");
    testEvalToBe("arr=[1,2,3]; List.filter(arr,{|e| e > 5})", "[]");
  });

  describe("every", () => {
    testEvalToBe("List.every([2,4,6], {|e| e > 1})", "true");
    testEvalToBe("List.every([2,4,5], {|e| e > 4})", "false");
    testEvalToBe("List.every([], {|e| e > 1})", "true");
  });

  describe("some", () => {
    testEvalToBe("List.some([2,4,6], {|e| e > 1})", "true");
    testEvalToBe("List.some([2,4,5], {|e| e > 7})", "false");
    testEvalToBe("List.some([], {|e| e > 7})", "false");
  });

  describe("find", () => {
    testEvalToBe("List.find([2,4,6], {|e| e > 2})", "4");
    testEvalToBe(
      "List.find([2,4,5], {|e| e > 7})",
      "Error(Error: No element found)"
    );
  });

  describe("findIndex", () => {
    testEvalToBe("List.findIndex([2,4,6], {|e| e > 2})", "1");
    testEvalToBe("List.findIndex([2,4,5], {|e| e > 7})", "-1"); // We might prefer a regular error here
  });

  describe("join", () => {
    testEvalToBe("arr=['a', 'b', 'c']; List.join(arr, '-')", '"a-b-c"');
    testEvalToBe("arr=['a', 'b', 'c']; List.join(arr, ' ')", '"a b c"');
    testEvalToBe("arr=['a', 'b', 'c']; List.join(arr)", '"a,b,c"');
  });

  describe("flatten", () => {
    testEvalToBe("List.flatten([[1,2], [3,4]])", "[1,2,3,4]");
    testEvalToBe("List.flatten([[1,2], [3,[4,5]]])", "[1,2,3,[4,5]]");
    testEvalToBe("List.flatten([])", "[]");
    testEvalToBe("List.flatten([[],[],[]])", "[]");
  });

  describe("zip", () => {
    testEvalToBe("List.zip([1,2], [3,4])", "[[1,3],[2,4]]");
    testEvalToBe(
      "List.zip([1,2,4], [3,4])",
      "Error(Argument Error: List lengths must be equal)"
    );
    testEvalToBe("List.zip([1,2], [3,[4,5]])", "[[1,3],[2,[4,5]]]");
    testEvalToBe(
      "List.zip([1,2], [3,[4,5], [5]])",
      "Error(Argument Error: List lengths must be equal)"
    );
    testEvalToBe("List.zip([], [])", "[]");
  });

  describe("unzip", () => {
    testEvalToBe("List.unzip([[1,3],[2,4]])", "[[1,2],[3,4]]");
    testEvalToBe("List.unzip([[1,3],[2,4],[5,6]])", "[[1,2,5],[3,4,6]]");
    testEvalToBe("List.unzip([])", "[[],[]]");
  });
});
