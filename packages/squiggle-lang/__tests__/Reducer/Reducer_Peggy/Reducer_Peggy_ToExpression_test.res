module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_ExpressionValue
module Parse = Reducer_Peggy_Parse
module ToExpression = Reducer_Peggy_ToExpression
module Result = Belt.Result

open Jest
open Expect

let expectToExpressionToBe = (expr, answer, ~v="_", ()) => {
  let rExpr = Parse.parse(expr)
    ->Result.map(ToExpression.fromNode)
  let a1 = rExpr->ExpressionT.toStringResultOkless
  if (v=="_") {
    a1->expect->toBe(answer)
  } else {
    let a2 = rExpr->Result.flatMap(
      expr => Expression.reduceExpression(expr, Belt.Map.String.empty, ExpressionValue.defaultEnvironment)
    )->ExpressionValue.toStringResultOkless
    (a1, a2)->expect->toEqual((answer, v))
  }
}

let testToExpression = (expr, answer, ~v="_", ()) => test(expr, () => expectToExpressionToBe(expr, answer, ~v=v, ()))

module MySkip = {
  let testToExpression = (expr, answer, ~v="_", ()) => Skip.test(expr, () => expectToExpressionToBe(expr, answer, ~v=v, ()))
}

module MyOnly = {
  let testToExpression = (expr, answer, ~v="_", ()) => Only.test(expr, () => expectToExpressionToBe(expr, answer, ~v=v, ()))
}

describe("Peggy to Expression", () => {
  describe("literals operators parenthesis", () => {
    // Note that there is always an outer block. Otherwise, external bindings are ignrored at the first statement
    testToExpression("1", "(:$$block 1)", ~v="1", ())
    testToExpression("'hello'", "(:$$block 'hello')", ~v="'hello'", ())
    testToExpression("true", "(:$$block true)", ~v="true", ())
    testToExpression("1+2", "(:$$block (:add 1 2))", ~v="3", ())
    testToExpression("add(1,2)", "(:$$block (:add 1 2))", ~v="3", ())
    testToExpression("(1)", "(:$$block 1)", ())
    testToExpression("(1+2)", "(:$$block (:add 1 2))", ())
  })

  describe("unary", () => {
    testToExpression("-1", "(:$$block (:unaryMinus 1))", ~v="-1", ())
    testToExpression("!true", "(:$$block (:not true))", ~v="false", ())
    testToExpression("1 + -1", "(:$$block (:add 1 (:unaryMinus 1)))", ~v="0", ())
    testToExpression("-a[0]", "(:$$block (:unaryMinus (:$atIndex :a 0)))", ())
  })

  describe("multi-line", () => {
    testToExpression("x=1; 2", "(:$$block (:$let :x (:$$block 1)) 2)", ~v="2", ())
    testToExpression("x=1; y=2", "(:$$block (:$let :x (:$$block 1)) (:$let :y (:$$block 2)))", ~v="{x: 1,y: 2}", ())
  })

  describe("variables", () => {
    testToExpression("x = 1", "(:$$block (:$let :x (:$$block 1)))", ~v="{x: 1}", ())
    testToExpression("x", "(:$$block :x)", ~v=":x", ()) //TODO: value should return error
    testToExpression("x = 1; x", "(:$$block (:$let :x (:$$block 1)) :x)", ~v="1", ())
  })

  describe("functions", () => {
    testToExpression("identity(x) = x", "(:$$block (:$let :identity (:$$lambda [x] (:$$block :x))))", ~v="{identity: lambda(x=>internal code)}", ()) // Function definitions become lambda assignments
    testToExpression("identity(x)", "(:$$block (:identity :x))", ()) // Note value returns error properly
  })

  describe("arrays", () => {
    testToExpression("[]", "(:$$block (:$constructArray ()))", ~v="[]", ())
    testToExpression("[0, 1, 2]", "(:$$block (:$constructArray (0 1 2)))", ~v="[0,1,2]", ())
    testToExpression("['hello', 'world']", "(:$$block (:$constructArray ('hello' 'world')))", ~v="['hello','world']", ())
    testToExpression("([0,1,2])[1]", "(:$$block (:$atIndex (:$constructArray (0 1 2)) 1))", ~v="1", ())
  })

  describe("records", () => {
    testToExpression("{a: 1, b: 2}", "(:$$block (:$constructRecord (('a' 1) ('b' 2))))", ~v="{a: 1,b: 2}", ())
    testToExpression("{1+0: 1, 2+0: 2}", "(:$$block (:$constructRecord (((:add 1 0) 1) ((:add 2 0) 2))))", ()) // key can be any expression
    testToExpression("record.property", "(:$$block (:$atIndex :record 'property'))", ())
    testToExpression("record={property: 1}; record.property", "(:$$block (:$let :record (:$$block (:$constructRecord (('property' 1))))) (:$atIndex :record 'property'))", ~v="1", ())
  })

  describe("comments", () => {
    testToExpression("1 # This is a line comment", "(:$$block 1)", ~v="1", ())
    testToExpression("1 // This is a line comment", "(:$$block 1)", ~v="1", ())
    testToExpression("1 /* This is a multi line comment */", "(:$$block 1)", ~v="1", ())
    testToExpression("/* This is a multi line comment */ 1", "(:$$block 1)", ~v="1", ())
  })

  describe("ternary operator", () => {
    testToExpression("true ? 1 : 0", "(:$$block (:$$ternary true 1 0))", ~v="1", ())
    testToExpression("false ? 1 : 0", "(:$$block (:$$ternary false 1 0))", ~v="0", ())
    testToExpression("true ? 1 : false ? 2 : 0", "(:$$block (:$$ternary true 1 (:$$ternary false 2 0)))", ~v="1", ()) // nested ternary
    testToExpression("false ? 1 : false ? 2 : 0", "(:$$block (:$$ternary false 1 (:$$ternary false 2 0)))", ~v="0", ()) // nested ternary
  })

  describe("if then else", () => {
    testToExpression("if true then 2 else 3", "(:$$block (:$$ternary true (:$$block 2) (:$$block 3)))", ())
    testToExpression("if true then {2} else {3}", "(:$$block (:$$ternary true (:$$block 2) (:$$block 3)))", ())
    testToExpression(
      "if false then {2} else if false then {4} else {5}",
      "(:$$block (:$$ternary false (:$$block 2) (:$$ternary false (:$$block 4) (:$$block 5))))", ()
    ) //nested if
  })

  describe("pipe", () => {
    testToExpression("1 -> add(2)", "(:$$block (:add 1 2))", ~v="3", ())
    testToExpression("-1 -> add(2)", "(:$$block (:add (:unaryMinus 1) 2))", ~v="1", ()) // note that unary has higher priority naturally
    testToExpression("1 -> add(2) * 3", "(:$$block (:multiply (:add 1 2) 3))", ~v="9", ())
  })

  describe("elixir pipe", () => {
    testToExpression("1 |> add(2)", "(:$$block (:add 1 2))", ~v="3", ())
  })

  // see testParse for priorities of to and credibleIntervalToDistribution

  describe("inner block", () => {
    // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
    // Like lambdas they have a local scope.
    testToExpression("y=99; x={y=1; y}", "(:$$block (:$let :y (:$$block 99)) (:$let :x (:$$block (:$let :y (:$$block 1)) :y)))", ~v="{x: 1,y: 99}", ())
  })

  describe("lambda", () => {
    testToExpression("{|x| x}", "(:$$block (:$$lambda [x] (:$$block :x)))", ~v="lambda(x=>internal code)", ())
    testToExpression("f={|x| x}", "(:$$block (:$let :f (:$$block (:$$lambda [x] (:$$block :x)))))", ~v="{f: lambda(x=>internal code)}", ())
    testToExpression("f(x)=x","(:$$block (:$let :f (:$$lambda [x] (:$$block :x))))", ~v="{f: lambda(x=>internal code)}", ()) // Function definitions are lambda assignments
    testToExpression("f(x)=x ? 1 : 0", "(:$$block (:$let :f (:$$lambda [x] (:$$block (:$$ternary :x 1 0)))))", ~v="{f: lambda(x=>internal code)}", ()) 
  })
})


