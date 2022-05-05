/*
  Macros are like functions but instead of taking values as parameters,
  they take expressions as parameters and return a new expression.
  Macros are used to define language building blocks. They are like Lisp macros.
*/
module Bindings = Reducer_Expression_Bindings
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module ExpressionWithContext = Reducer_ExpressionWithContext
module Result = Belt.Result
open Reducer_Expression_ExpressionBuilder

type environment = ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type expressionWithContext = ExpressionWithContext.expressionWithContext

let dispatchMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  environment,
  reduceExpression: ExpressionT.reducerFn,
): result<expressionWithContext, errorValue> => {
  let doBindStatement = (bindingExpr: expression, statement: expression, environment) =>
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(EvCall("$let")), symbolExpr, statement}) => {
        let rExternalBindingsValue = reduceExpression(bindingExpr, bindings, environment)

        rExternalBindingsValue->Result.flatMap(externalBindingsValue => {
          let newBindings = Bindings.fromValue(externalBindingsValue)

          // Js.log(
          //   `bindStatement ${Bindings.toString(newBindings)}<==${ExpressionT.toString(
          //       bindingExpr,
          //     )} statement: $let ${ExpressionT.toString(symbolExpr)}=${ExpressionT.toString(
          //       statement,
          //     )}`,
          // )

          let rNewStatement = Bindings.replaceSymbols(newBindings, statement)
          rNewStatement->Result.map(newStatement =>
            ExpressionWithContext.withContext(
              eFunction(
                "$setBindings",
                list{newBindings->Bindings.toExternalBindings->eRecord, symbolExpr, newStatement},
              ),
              newBindings,
            )
          )
        })
      }
    | _ => REAssignmentExpected->Error
    }

  let doBindExpression = (bindingExpr: expression, statement: expression, environment): result<
    expressionWithContext,
    errorValue,
  > =>
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(EvCall("$let")), symbolExpr, statement}) => {
        let rExternalBindingsValue = reduceExpression(bindingExpr, bindings, environment)

        rExternalBindingsValue->Result.flatMap(externalBindingsValue => {
          let newBindings = Bindings.fromValue(externalBindingsValue)
          let rNewStatement = Bindings.replaceSymbols(newBindings, statement)
          rNewStatement->Result.map(newStatement =>
            ExpressionWithContext.withContext(
              eFunction(
                "$exportBindings",
                list{
                  eFunction(
                    "$setBindings",
                    list{
                      newBindings->Bindings.toExternalBindings->eRecord,
                      symbolExpr,
                      newStatement,
                    },
                  ),
                },
              ),
              newBindings,
            )
          )
        })
      }
    | _ => {
        let rExternalBindingsValue: result<expressionValue, errorValue> = reduceExpression(
          bindingExpr,
          bindings,
          environment,
        )

        rExternalBindingsValue->Result.flatMap(externalBindingsValue => {
          let newBindings = Bindings.fromValue(externalBindingsValue)
          let rNewStatement = Bindings.replaceSymbols(newBindings, statement)
          rNewStatement->Result.map(newStatement =>
            ExpressionWithContext.withContext(newStatement, newBindings)
          )
        })
      }
    }

  let doBlock = (exprs: list<expression>, _bindings: ExpressionT.bindings, _environment): result<
    expressionWithContext,
    errorValue,
  > => {
    let exprsArray = Belt.List.toArray(exprs)
    let maxIndex = Js.Array2.length(exprsArray) - 1
    let newStatement = exprsArray->Js.Array2.reducei((acc, statement, index) =>
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
    , eSymbol("undefined block"))
    ExpressionWithContext.noContext(newStatement)->Ok
  }

  let doLambdaDefinition = (
    bindings: ExpressionT.bindings,
    parameters: array<string>,
    lambdaDefinition: ExpressionT.expression,
  ) =>
    ExpressionWithContext.noContext(
      eLambda(parameters, bindings->Bindings.toExternalBindings, lambdaDefinition),
    )->Ok

  let doTernary = (
    condition: expression,
    ifTrue: expression,
    ifFalse: expression,
    bindings: ExpressionT.bindings,
    environment,
  ): result<expressionWithContext, errorValue> => {
    let blockCondition = ExpressionBuilder.eBlock(list{condition})
    let rCondition = reduceExpression(blockCondition, bindings, environment)
    rCondition->Result.flatMap(conditionValue =>
      switch conditionValue {
      | ExpressionValue.EvBool(false) => ExpressionWithContext.noContext(ifFalse)->Ok
      | ExpressionValue.EvBool(true) => ExpressionWithContext.noContext(ifTrue)->Ok
      | _ => REExpectedType("Boolean")->Error
      }
    )
  }

  let expandExpressionList = (aList, bindings: ExpressionT.bindings, environment): result<
    expressionWithContext,
    errorValue,
  > =>
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
    | list{ExpressionT.EValue(EvCall("$$ternary")), condition, ifTrue, ifFalse} =>
      doTernary(condition, ifTrue, ifFalse, bindings, environment)
    | _ => ExpressionWithContext.noContext(ExpressionT.EList(aList))->Ok
    }

  switch macroExpression {
  | EList(aList) => expandExpressionList(aList, bindings, environment)
  | _ => ExpressionWithContext.noContext(macroExpression)->Ok
  }
}
