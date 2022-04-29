/*
  Macros are like functions but instead of taking values as parameters,
  they take expressions as parameters and return a new expression.
  Macros are used to define language building blocks. They are like Lisp macros.
*/
module Bindings = Reducer_Expression_Bindings
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result
open Reducer_Expression_ExpressionBuilder

type expression = ExpressionT.expression
type environment = ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue

let dispatchMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  environment,
  reduceExpression: ExpressionT.reducerFn,
): result<expression, errorValue> => {
  let doBindStatement = (bindingExpr: expression, statement: expression, environment) =>
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(EvCall("$let")), symbolExpr, statement}) => {
        let rExternalBindingsValue = reduceExpression(bindingExpr, bindings, environment)

        rExternalBindingsValue->Result.flatMap(externalBindingsValue => {
          let newBindings = Bindings.fromValue(externalBindingsValue)
          let rNewStatement = Bindings.replaceSymbols(newBindings, statement)
          rNewStatement->Result.map(newStatement =>
            eFunction(
              "$setBindings",
              list{newBindings->Bindings.toExternalBindings->eRecord, symbolExpr, newStatement},
            )
          )
        })
      }
    | _ => REAssignmentExpected->Error
    }

  let doBindExpression = (bindingExpr: expression, statement: expression, environment) =>
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(EvCall("$let")), symbolExpr, statement}) => {
        let rExternalBindingsValue = reduceExpression(
          bindingExpr,
          Belt.Map.String.fromArray([("x", ExpressionValue.EvNumber(666.))]),
          // bindingsToHandDown,
          environment,
        )

        rExternalBindingsValue->Result.flatMap(externalBindingsValue => {
          let newBindings = Bindings.fromValue(externalBindingsValue)
          let rNewStatement = Bindings.replaceSymbols(newBindings, statement)
          rNewStatement->Result.map(newStatement =>
            eFunction(
              "$exportBindings",
              list{
                eFunction(
                  "$setBindings",
                  list{newBindings->Bindings.toExternalBindings->eRecord, symbolExpr, newStatement},
                ),
              },
            )
          )
        })
      }
    | _ => {
        let rExternalBindingsValue = reduceExpression(bindingExpr, bindings, environment)
        rExternalBindingsValue->Result.flatMap(externalBindingsValue => {
          let newBindings = Bindings.fromValue(externalBindingsValue)
          let rNewStatement = Bindings.replaceSymbols(newBindings, statement)
          rNewStatement
        })
      }
    }

  let doBlock = (exprs: list<expression>, _bindings: ExpressionT.bindings, _environment): result<
    expression,
    errorValue,
  > => {
    let exprsArray = Belt.List.toArray(exprs)
    let maxIndex = Js.Array2.length(exprsArray) - 1
    exprsArray->Js.Array2.reducei((acc, statement, index) =>
      if index == 0 {
        if index == maxIndex {
          eBindExpressionDefault(statement)
        } else {
          eBindStatementDefault(statement)
        }
      } else if index == maxIndex {
        eBindExpression(acc, statement)
      } else {
        eBindStatement(acc, statement)
      }
    , eSymbol("undefined block"))->Ok
  }

  let doLambdaDefinition = (
    bindings: ExpressionT.bindings,
    parameters: array<string>,
    lambdaDefinition: ExpressionT.expression,
  ) => eLambda(parameters, bindings->Bindings.toExternalBindings, lambdaDefinition)->Ok

  let expandExpressionList = (aList, bindings: ExpressionT.bindings, environment) =>
    switch aList {
    | list{
        ExpressionT.EValue(EvCall("$$bindStatement")),
        bindingExpr: ExpressionT.expression,
        statement,
      } =>
      doBindStatement(bindingExpr, statement, environment)
    | list{ExpressionT.EValue(EvCall("$$bindStatement")), statement} =>
      // bindings of the context are used when there is no binding expression
      doBindStatement(eRecord(Bindings.toExternalBindings(bindings)), statement, environment)
    | list{
        ExpressionT.EValue(EvCall("$$bindExpression")),
        bindingExpr: ExpressionT.expression,
        expression,
      } =>
      doBindExpression(bindingExpr, expression, environment)
    | list{ExpressionT.EValue(EvCall("$$bindExpression")), expression} =>
      // bindings of the context are used when there is no binding expression
      doBindExpression(eRecord(Bindings.toExternalBindings(bindings)), expression, environment)
    | list{ExpressionT.EValue(EvCall("$$block")), ...exprs} => doBlock(exprs, bindings, environment)
    | list{
        ExpressionT.EValue(EvCall("$$lambda")),
        ExpressionT.EValue(EvArrayString(parameters)),
        lambdaDefinition,
      } =>
      doLambdaDefinition(bindings, parameters, lambdaDefinition)
    | _ => ExpressionT.EList(aList)->Ok
    }

  switch macroExpression {
  | EList(aList) => expandExpressionList(aList, bindings, environment)
  | _ => macroExpression->Ok
  }
}
