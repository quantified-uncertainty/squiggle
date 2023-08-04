import { testToExpression } from "../helpers/reducerHelpers.js";

describe("Peggy to Expression", () => {
  describe("literals operators parenthesis", () => {
    // Note that there is always an outer block. Otherwise, external bindings are ignored at the first statement
    testToExpression("1", "1", "1");
    testToExpression("'hello'", '"hello"', '"hello"');
    testToExpression("true", "true", "true");
    testToExpression("1+2", "(add)(1, 2)", "3");
    testToExpression("add(1,2)", "(add)(1, 2)", "3");
    testToExpression("(1)", "1");
    testToExpression("(1+2)", "(add)(1, 2)");
  });

  describe("unary", () => {
    testToExpression("-1", "(unaryMinus)(1)", "-1");
    testToExpression("!true", "(not)(true)", "false");
    testToExpression("1 + -1", "(add)(1, (unaryMinus)(1))", "0");
    testToExpression(
      "a = [3,4]; -a[0]",
      "a = {[3, 4]}; (unaryMinus)(($_atIndex_$)(a, 0))"
    );
  });

  describe("multi-line", () => {
    testToExpression("x=1; 2", "x = {1}; 2", "2");
    testToExpression("x=1; y=2", "x = {1}; y = {2}");
  });

  describe("variables", () => {
    testToExpression("x = 1", "x = {1}");
    testToExpression("x", "Error(x is not defined)");
    testToExpression("x = 1; x", "x = {1}; x", "1");
  });

  describe("functions", () => {
    testToExpression("identity(x) = x", "identity = {|x| {x}}"); // Function definitions become lambda assignments
    testToExpression("identity(x)", "Error(identity is not defined)"); // Note value returns error properly
    testToExpression(
      "f(x) = x> 2 ? 0 : 1; f(3)",
      "f = {|x| {(larger)(x, 2) ? (0) : (1)}}; (f)(3)",
      "0"
    );
  });

  describe("arrays", () => {
    testToExpression("[]", "[]", "[]");
    testToExpression("[0, 1, 2]", "[0, 1, 2]", "[0,1,2]");
    testToExpression(
      "['hello', 'world']",
      '["hello", "world"]',
      '["hello","world"]'
    );
    testToExpression("([0,1,2])[1]", "($_atIndex_$)([0, 1, 2], 1)", "1");
  });

  describe("dicts", () => {
    testToExpression("{a: 1, b: 2}", '{"a": 1, "b": 2}', "{a: 1,b: 2}");
    testToExpression("{1+0: 1, 2+0: 2}", "{(add)(1, 0): 1, (add)(2, 0): 2}"); // key can be any expression
    testToExpression("dict.property", "Error(dict is not defined)");
    testToExpression(
      "dict={property: 1}; dict.property",
      'dict = {{"property": 1}}; ($_atIndex_$)(dict, "property")',
      "1"
    );
  });

  describe("comments", () => {
    testToExpression("1 // This is a line comment", "1", "1");
    testToExpression("1 /* This is a multi line comment */", "1", "1");
    testToExpression("/* This is a multi line comment */ 1", "1", "1");
  });

  describe("ternary operator", () => {
    testToExpression("true ? 1 : 0", "true ? (1) : (0)", "1");
    testToExpression("false ? 1 : 0", "false ? (1) : (0)", "0");
    testToExpression(
      "true ? 1 : false ? 2 : 0",
      "true ? (1) : (false ? (2) : (0))",
      "1"
    ); // nested ternary
    testToExpression(
      "false ? 1 : false ? 2 : 0",
      "false ? (1) : (false ? (2) : (0))",
      "0"
    ); // nested ternary
    describe("ternary bindings", () => {
      testToExpression(
        // expression binding
        "f(a) = a > 5 ? 1 : 0; f(6)",
        "f = {|a| {(larger)(a, 5) ? (1) : (0)}}; (f)(6)",
        "1"
      );
      testToExpression(
        // when true binding
        "f(a) = a > 5 ? a : 0; f(6)",
        "f = {|a| {(larger)(a, 5) ? (a) : (0)}}; (f)(6)",
        "6"
      );
      testToExpression(
        // when false binding
        "f(a) = a < 5 ? 1 : a; f(6)",
        "f = {|a| {(smaller)(a, 5) ? (1) : (a)}}; (f)(6)",
        "6"
      );
    });
  });

  describe("if then else", () => {
    testToExpression("if true then 2 else 3", "true ? ({2}) : ({3})");
    testToExpression("if true then {2} else {3}", "true ? ({2}) : ({3})");
    testToExpression(
      "if false then {2} else if false then {4} else {5}",
      "false ? ({2}) : (false ? ({4}) : ({5}))"
    ); //nested if
  });

  describe("pipe", () => {
    testToExpression("1 -> add(2)", "(add)(1, 2)", "3");
    testToExpression("-1 -> add(2)", "(add)((unaryMinus)(1), 2)", "1"); // note that unary has higher priority naturally
    testToExpression("1 -> add(2) * 3", "(multiply)((add)(1, 2), 3)", "9");
  });

  // see testParse for priorities of 'to'

  describe("inner block", () => {
    // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
    // Like lambdas they have a local scope.
    testToExpression(
      "y=99; x={y=1; y}",
      "y = {99}; x = {y = {1}; y}"
      // "{(:$_let_$ :y {99}); (:$_let_$ :x {(:$_let_$ :y {1}); :y}); (:$_endOfOuterBlock_$ () ())}",
    );
  });

  describe("lambda", () => {
    testToExpression("{|x| x}", "{|x| x}", "lambda(x=>internal code)");
    testToExpression("f={|x| x}", "f = {|x| x}");
    testToExpression("f(x)=x", "f = {|x| {x}}"); // Function definitions are lambda assignments
    testToExpression("f(x)=x ? 1 : 0", "f = {|x| {x ? (1) : (0)}}");
  });

  describe("module", () => {
    testToExpression(
      "Math.pi",
      "3.141592653589793", // inlined
      "3.141592653589793"
    );
  });
});
