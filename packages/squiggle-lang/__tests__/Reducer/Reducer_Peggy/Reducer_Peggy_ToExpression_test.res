module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_ExpressionValue
module Parse = Reducer_Peggy_Parse
module ToExpression = Reducer_Peggy_ToExpression
module Result = Belt.Result

open Jest
open Expect

let expectToExpressionToBe = (expr, answer, ~v="_", ()) => {
  let rExpr = Parse.parse(expr)->Result.map(ToExpression.fromNode)
  let a1 = rExpr->ExpressionT.toStringResultOkless
  if v == "_" {
    a1->expect->toBe(answer)
  } else {
    let a2 =
      rExpr
      ->Result.flatMap(expr =>
        Expression.reduceExpression(expr, Belt.Map.String.empty, ExpressionValue.defaultEnvironment)
      )
      ->ExpressionValue.toStringResultOkless
    (a1, a2)->expect->toEqual((answer, v))
  }
}

let testToExpression = (expr, answer, ~v="_", ()) =>
  test(expr, () => expectToExpressionToBe(expr, answer, ~v, ()))

module MySkip = {
  let testToExpression = (expr, answer, ~v="_", ()) =>
    Skip.test(expr, () => expectToExpressionToBe(expr, answer, ~v, ()))
}

module MyOnly = {
  let testToExpression = (expr, answer, ~v="_", ()) =>
    Only.test(expr, () => expectToExpressionToBe(expr, answer, ~v, ()))
}

describe("Peggy to Expression", () => {
  describe("literals operators parenthesis", () => {
    // Note that there is always an outer block. Otherwise, external bindings are ignrored at the first statement
    testToExpression("1", "(:$$_block_$$ 1)", ~v="1", ())
    testToExpression("'hello'", "(:$$_block_$$ 'hello')", ~v="'hello'", ())
    testToExpression("true", "(:$$_block_$$ true)", ~v="true", ())
    testToExpression("1+2", "(:$$_block_$$ (:add 1 2))", ~v="3", ())
    testToExpression("add(1,2)", "(:$$_block_$$ (:add 1 2))", ~v="3", ())
    testToExpression("(1)", "(:$$_block_$$ 1)", ())
    testToExpression("(1+2)", "(:$$_block_$$ (:add 1 2))", ())
  })

  describe("unary", () => {
    testToExpression("-1", "(:$$_block_$$ (:unaryMinus 1))", ~v="-1", ())
    testToExpression("!true", "(:$$_block_$$ (:not true))", ~v="false", ())
    testToExpression("1 + -1", "(:$$_block_$$ (:add 1 (:unaryMinus 1)))", ~v="0", ())
    testToExpression("-a[0]", "(:$$_block_$$ (:unaryMinus (:$_atIndex_$ :a 0)))", ())
  })

  describe("multi-line", () => {
    testToExpression("x=1; 2", "(:$$_block_$$ (:$_let_$ :x (:$$_block_$$ 1)) 2)", ~v="2", ())
    testToExpression(
      "x=1; y=2",
      "(:$$_block_$$ (:$_let_$ :x (:$$_block_$$ 1)) (:$_let_$ :y (:$$_block_$$ 2)))",
      ~v="{x: 1,y: 2}",
      (),
    )
  })

  describe("variables", () => {
    testToExpression("x = 1", "(:$$_block_$$ (:$_let_$ :x (:$$_block_$$ 1)))", ~v="{x: 1}", ())
    testToExpression("x", "(:$$_block_$$ :x)", ~v=":x", ()) //TODO: value should return error
    testToExpression("x = 1; x", "(:$$_block_$$ (:$_let_$ :x (:$$_block_$$ 1)) :x)", ~v="1", ())
  })

  describe("functions", () => {
    testToExpression(
      "identity(x) = x",
      "(:$$_block_$$ (:$_let_$ :identity (:$$_lambda_$$ [x] (:$$_block_$$ :x))))",
      ~v="{identity: lambda(x=>internal code)}",
      (),
    ) // Function definitions become lambda assignments
    testToExpression("identity(x)", "(:$$_block_$$ (:identity :x))", ()) // Note value returns error properly
    testToExpression(
      "f(x) = x> 2 ? 0 : 1; f(3)",
      "(:$$_block_$$ (:$_let_$ :f (:$$_lambda_$$ [x] (:$$_block_$$ (:$$_ternary_$$ (:larger :x 2) 0 1)))) (:f 3))",
      ~v="0",
      (),
    )
  })

  describe("arrays", () => {
    testToExpression("[]", "(:$$_block_$$ (:$_constructArray_$ ()))", ~v="[]", ())
    testToExpression("[0, 1, 2]", "(:$$_block_$$ (:$_constructArray_$ (0 1 2)))", ~v="[0,1,2]", ())
    testToExpression(
      "['hello', 'world']",
      "(:$$_block_$$ (:$_constructArray_$ ('hello' 'world')))",
      ~v="['hello','world']",
      (),
    )
    testToExpression(
      "([0,1,2])[1]",
      "(:$$_block_$$ (:$_atIndex_$ (:$_constructArray_$ (0 1 2)) 1))",
      ~v="1",
      (),
    )
  })

  describe("records", () => {
    testToExpression(
      "{a: 1, b: 2}",
      "(:$$_block_$$ (:$_constructRecord_$ (('a' 1) ('b' 2))))",
      ~v="{a: 1,b: 2}",
      (),
    )
    testToExpression(
      "{1+0: 1, 2+0: 2}",
      "(:$$_block_$$ (:$_constructRecord_$ (((:add 1 0) 1) ((:add 2 0) 2))))",
      (),
    ) // key can be any expression
    testToExpression("record.property", "(:$$_block_$$ (:$_atIndex_$ :record 'property'))", ())
    testToExpression(
      "record={property: 1}; record.property",
      "(:$$_block_$$ (:$_let_$ :record (:$$_block_$$ (:$_constructRecord_$ (('property' 1))))) (:$_atIndex_$ :record 'property'))",
      ~v="1",
      (),
    )
  })

  describe("comments", () => {
    testToExpression("1 # This is a line comment", "(:$$_block_$$ 1)", ~v="1", ())
    testToExpression("1 // This is a line comment", "(:$$_block_$$ 1)", ~v="1", ())
    testToExpression("1 /* This is a multi line comment */", "(:$$_block_$$ 1)", ~v="1", ())
    testToExpression("/* This is a multi line comment */ 1", "(:$$_block_$$ 1)", ~v="1", ())
  })

  describe("ternary operator", () => {
    testToExpression("true ? 1 : 0", "(:$$_block_$$ (:$$_ternary_$$ true 1 0))", ~v="1", ())
    testToExpression("false ? 1 : 0", "(:$$_block_$$ (:$$_ternary_$$ false 1 0))", ~v="0", ())
    testToExpression(
      "true ? 1 : false ? 2 : 0",
      "(:$$_block_$$ (:$$_ternary_$$ true 1 (:$$_ternary_$$ false 2 0)))",
      ~v="1",
      (),
    ) // nested ternary
    testToExpression(
      "false ? 1 : false ? 2 : 0",
      "(:$$_block_$$ (:$$_ternary_$$ false 1 (:$$_ternary_$$ false 2 0)))",
      ~v="0",
      (),
    ) // nested ternary
  })

  describe("if then else", () => {
    testToExpression(
      "if true then 2 else 3",
      "(:$$_block_$$ (:$$_ternary_$$ true (:$$_block_$$ 2) (:$$_block_$$ 3)))",
      (),
    )
    testToExpression(
      "if true then {2} else {3}",
      "(:$$_block_$$ (:$$_ternary_$$ true (:$$_block_$$ 2) (:$$_block_$$ 3)))",
      (),
    )
    testToExpression(
      "if false then {2} else if false then {4} else {5}",
      "(:$$_block_$$ (:$$_ternary_$$ false (:$$_block_$$ 2) (:$$_ternary_$$ false (:$$_block_$$ 4) (:$$_block_$$ 5))))",
      (),
    ) //nested if
  })

  describe("pipe", () => {
    testToExpression("1 -> add(2)", "(:$$_block_$$ (:add 1 2))", ~v="3", ())
    testToExpression("-1 -> add(2)", "(:$$_block_$$ (:add (:unaryMinus 1) 2))", ~v="1", ()) // note that unary has higher priority naturally
    testToExpression("1 -> add(2) * 3", "(:$$_block_$$ (:multiply (:add 1 2) 3))", ~v="9", ())
  })

  describe("elixir pipe", () => {
    testToExpression("1 |> add(2)", "(:$$_block_$$ (:add 1 2))", ~v="3", ())
  })

  // see testParse for priorities of to and credibleIntervalToDistribution

  describe("inner block", () => {
    // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
    // Like lambdas they have a local scope.
    testToExpression(
      "y=99; x={y=1; y}",
      "(:$$_block_$$ (:$_let_$ :y (:$$_block_$$ 99)) (:$_let_$ :x (:$$_block_$$ (:$_let_$ :y (:$$_block_$$ 1)) :y)))",
      ~v="{x: 1,y: 99}",
      (),
    )
  })

  describe("lambda", () => {
    testToExpression(
      "{|x| x}",
      "(:$$_block_$$ (:$$_lambda_$$ [x] (:$$_block_$$ :x)))",
      ~v="lambda(x=>internal code)",
      (),
    )
    testToExpression(
      "f={|x| x}",
      "(:$$_block_$$ (:$_let_$ :f (:$$_block_$$ (:$$_lambda_$$ [x] (:$$_block_$$ :x)))))",
      ~v="{f: lambda(x=>internal code)}",
      (),
    )
    testToExpression(
      "f(x)=x",
      "(:$$_block_$$ (:$_let_$ :f (:$$_lambda_$$ [x] (:$$_block_$$ :x))))",
      ~v="{f: lambda(x=>internal code)}",
      (),
    ) // Function definitions are lambda assignments
    testToExpression(
      "f(x)=x ? 1 : 0",
      "(:$$_block_$$ (:$_let_$ :f (:$$_lambda_$$ [x] (:$$_block_$$ (:$$_ternary_$$ :x 1 0)))))",
      ~v="{f: lambda(x=>internal code)}",
      (),
    )
  })
})
