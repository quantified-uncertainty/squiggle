open Jest
// open Expect

open Reducer_Expression_ExpressionBuilder
open Reducer_TestMacroHelpers
module ExpressionT = Reducer_Expression_T

let exampleExpression = eNumber(1.)
let exampleExpressionY = eSymbol("y")
let exampleStatement = eLetStatement("y", eNumber(1.))
let exampleStatementX = eLetStatement("y", eSymbol("x"))
let exampleStatementZ = eLetStatement("z", eSymbol("y"))

// If it is not a mactro then it is not expanded
testMacro([], exampleExpression, "Ok(1)")

describe("bindStatement", () => {
  // A statement is bound by the bindings created by the previous statement
  testMacro([], eBindStatement(eBindings([]), exampleStatement), "Ok((:$setBindings {} :y 1))")
  // Then it answers the bindings for the next statement when reduced
  testMacroEval([], eBindStatement(eBindings([]), exampleStatement), "Ok({y: 1})")
  // Now let's feed a binding to see what happens
  testMacro(
    [],
    eBindStatement(eBindings([("x", EvNumber(2.))]), exampleStatementX),
    "Ok((:$setBindings {x: 2} :y 2))",
  )
  // An expression does not return a binding, thus error
  testMacro([], eBindStatement(eBindings([]), exampleExpression), "Error(Assignment expected)")
  // When bindings from previous statement are missing the context is injected. This must be the first statement of a block
  testMacro(
    [("z", EvNumber(99.))],
    eBindStatementDefault(exampleStatement),
    "Ok((:$setBindings {z: 99} :y 1))",
  )
})

describe("bindExpression", () => {
  // x is simply bound in the expression
  testMacro([], eBindExpression(eBindings([("x", EvNumber(2.))]), eSymbol("x")), "Ok(2)")
  // When an let statement is the end expression then bindings are returned
  testMacro(
    [],
    eBindExpression(eBindings([("x", EvNumber(2.))]), exampleStatement),
    "Ok((:$exportBindings (:$setBindings {x: 2} :y 1)))",
  )
  // Now let's reduce that expression
  testMacroEval(
    [],
    eBindExpression(eBindings([("x", EvNumber(2.))]), exampleStatement),
    "Ok({x: 2,y: 1})",
  )
  // When bindings are missing the context is injected. This must be the first and last statement of a block
  testMacroEval(
    [("z", EvNumber(99.))],
    eBindExpressionDefault(exampleStatement),
    "Ok({y: 1,z: 99})",
  )
})

describe("block", () => {
  // Block with a single expression
  testMacro([], eBlock(list{exampleExpression}), "Ok((:$$bindExpression 1))")
  testMacroEval([], eBlock(list{exampleExpression}), "Ok(1)")
  // Block with a single statement
  testMacro([], eBlock(list{exampleStatement}), "Ok((:$$bindExpression (:$let :y 1)))")
  testMacroEval([], eBlock(list{exampleStatement}), "Ok({y: 1})")
  // Block with a statement and an expression
  testMacro(
    [],
    eBlock(list{exampleStatement, exampleExpressionY}),
    "Ok((:$$bindExpression (:$$bindStatement (:$let :y 1)) :y))",
  )
  testMacroEval([], eBlock(list{exampleStatement, exampleExpressionY}), "Ok(1)")
  // Block with a statement and another statement
  testMacro(
    [],
    eBlock(list{exampleStatement, exampleStatementZ}),
    "Ok((:$$bindExpression (:$$bindStatement (:$let :y 1)) (:$let :z :y)))",
  )
  testMacroEval([], eBlock(list{exampleStatement, exampleStatementZ}), "Ok({y: 1,z: 1})")
  // Block inside a block
  testMacro(
    [],
    eBlock(list{eBlock(list{exampleExpression})}),
    "Ok((:$$bindExpression (:$$block 1)))",
  )
  testMacroEval([], eBlock(list{eBlock(list{exampleExpression})}), "Ok(1)")
  // Block assigned to a variable
  testMacro(
    [],
    eBlock(list{eLetStatement("z", eBlock(list{eBlock(list{exampleExpressionY})}))}),
    "Ok((:$$bindExpression (:$let :z (:$$block (:$$block :y)))))",
  )
  testMacroEval(
    [],
    eBlock(list{eLetStatement("z", eBlock(list{eBlock(list{exampleExpressionY})}))}),
    "Ok({z: :y})",
  )
  // Empty block
  testMacro([], eBlock(list{}), "Ok(:undefined block)") //TODO: should be an error
})

describe("lambda", () => {
  // assign a lambda to a variable
  let lambdaExpression = eFunction("$$lambda", list{eArrayString(["y"]), exampleExpressionY})
  testMacro([], lambdaExpression, "Ok(lambda(y=>internal))")
  // call a lambda
  let callLambdaExpression = list{lambdaExpression, eNumber(1.)}->ExpressionT.EList
  testMacro([], callLambdaExpression, "Ok(((:$$lambda [y] :y) 1))")
  testMacroEval([], callLambdaExpression, "Ok(1)")
  // Parameters shadow the outer scope
  testMacroEval([("y", EvNumber(666.))], callLambdaExpression, "Ok(1)")
  // When not shadowed by the parameters, the outer scope variables are available
  let lambdaExpression = eFunction(
    "$$lambda",
    list{eArrayString(["z"]), eFunction("add", list{eSymbol("y"), eSymbol("z")})},
  )
  let callLambdaExpression = eList(list{lambdaExpression, eNumber(1.)})
  testMacroEval([("y", EvNumber(666.))], callLambdaExpression, "Ok(667)")
})
