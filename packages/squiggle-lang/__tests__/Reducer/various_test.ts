import { evaluateStringToResult } from "../../src/reducer";
import {
  expectEvalToBe,
  testDescriptionEvalToBe,
  testEvalError,
  testEvalToBe,
} from "../helpers/reducerHelpers";

describe("eval", () => {
  describe("expressions", () => {
    testEvalToBe("1", "1");
    testEvalToBe("-1", "-1");
    testEvalToBe("1-1", "0");
    testEvalToBe("1+2", "3");
    testEvalToBe("(1+2)*3", "9");
    testEvalToBe("2>1", "true");
    testEvalToBe("concat('a ', 'b')", "'a b'");
    testEvalToBe("concat([3,4], [5,6,7])", "[3,4,5,6,7]");
    testEvalToBe("log(10)", "2.302585092994046");
    testEvalToBe("Math.cos(10)", "-0.8390715290764524");
    // most library tests are in __tests__/library/
  });

  describe("missing function", () => {
    testEvalToBe("testZadanga(1)", "Error(testZadanga is not defined)");

    testEvalToBe(
      "arr = [normal(3,2)]; map(arr, zarathsuzaWasHere)",
      "Error(zarathsuzaWasHere is not defined)"
    );
  });

  describe("arrays", () => {
    test("empty array", () => expectEvalToBe("[]", "[]"));
    testEvalToBe("[1, 2, 3]", "[1,2,3]");
    testEvalToBe("['hello', 'world']", "['hello','world']");
    testEvalToBe("([0,1,2])[1]", "1");
    testDescriptionEvalToBe(
      "index not found",
      "([0,1,2])[10]",
      "Error(Array index not found: 10)"
    );
  });
  describe("records", () => {
    test("empty", () => expectEvalToBe("{}", "{}"));
    test("define", () => expectEvalToBe("{a: 1, b: 2}", "{a: 1,b: 2}"));
    test("index", () => expectEvalToBe("r = {a: 1}; r.a", "1"));
    test("index", () =>
      expectEvalToBe("r = {a: 1}; r.b", "Error(Record property not found: b)"));
    testEvalError("{a: 1}.b"); // invalid syntax
    test("always the same property ending", () =>
      expectEvalToBe(
        `{
      a: 1, 
      b: 2,
    }`,
        "{a: 1,b: 2}"
      ));
  });

  describe("multi-line", () => {
    testEvalError("1; 2");
    testEvalError("1+1; 2+1");
  });
  describe("assignment", () => {
    testEvalToBe("x=1; x", "1");
    testEvalToBe("x=1+1; x+1", "3");
    testEvalToBe("x=1; y=x+1; y+1", "3");
    testEvalError("1; x=1");
    testEvalError("1; 1");
    testEvalToBe("x=1; x=1; x", "1");
  });

  describe("blocks", () => {
    testEvalToBe("x = { y = { z = 5; z * 2 }; y + 3 }; x", "13");
  });

  describe("chain call", () => {
    describe("to function", () => {
      testEvalToBe("f(x)=x; 1->f", "1");
      testEvalToBe("f(x,y)=x+y; 1->f(2)", "3");
    });
    describe("to block", () => {
      testEvalToBe("1->{|x| x}", "1");
      testEvalToBe("6->{|x,y| x/y}(2)", "3");
    });
    describe("to expression", () => {
      testEvalToBe("1->{f:{|x|x+2}}.f", "3");
      testEvalToBe("1->{f:{|x|x+2}}['f']", "3");
    });
  });
});

describe("test exceptions", () => {
  testDescriptionEvalToBe(
    "javascript exception",
    "javascriptraise('div by 0')",
    "Error(JS Exception: Error: 'div by 0')"
  );
  // testDescriptionEvalToBe(
  //   "rescript exception",
  //   "rescriptraise()",
  //   "Error(TODO: unhandled rescript exception)",
  // )
});

describe("stacktraces", () => {
  test("nested calls", () => {
    const result = evaluateStringToResult(`
  f(x) = {
    y = "a"
    x + y
  }
  g = {|x| f(x)}
  h(x) = g(x)
  h(5)
`);
    if (result.ok) {
      throw new Error("Expected code to fail");
    }
    const error = result.value.toStringWithStackTrace();

    expect(error)
      .toBe(`Error: There are function matches for add(), but with different arguments: [add(number, number)]; [add(distribution, number)]; [add(number, distribution)]; [add(distribution, distribution)]; [add(date, duration)]; [add(duration, duration)]
Stack trace:
  f at line 4, column 5, file main
  g at line 6, column 12, file main
  h at line 7, column 10, file main
  <top> at line 8, column 3, file main`);
  });
});
