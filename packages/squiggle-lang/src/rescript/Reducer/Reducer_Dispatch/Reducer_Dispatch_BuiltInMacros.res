/*
  Macros are like functions but instead of taking values as parameters,
  they take expressions as parameters and return a new expression.
  Macros are used to define language building blocks. They are like Lisp macros.
*/
module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ErrorValue = Reducer_ErrorValue
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionWithContext = Reducer_ExpressionWithContext
module Module = Reducer_Category_Module
module Result = Belt.Result
open Reducer_Expression_ExpressionBuilder

type environment = ExpressionValue.environment
type errorValue = ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type expressionWithContext = ExpressionWithContext.expressionWithContext

let dispatchMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  environment,
  reduceExpression: ExpressionT.reducerFn,
): result<expressionWithContext, errorValue> => {
  let useExpressionToSetBindings = (bindingExpr: expression, environment, statement, newCode) => {
    let rExternalBindingsValue = reduceExpression(bindingExpr, bindings, environment)

    rExternalBindingsValue->Result.flatMap(nameSpaceValue => {
      let newBindings = Module.fromExpressionValue(nameSpaceValue)

      let rNewStatement = BindingsReplacer.replaceSymbols(newBindings, statement)
      rNewStatement->Result.map(boundStatement =>
        ExpressionWithContext.withContext(
          newCode(newBindings->eModule, boundStatement),
          newBindings,
        )
      )
    })
  }

  let correspondingSetBindingsFn = (fnName: string): string =>
    switch fnName {
    | "$_let_$" => "$_setBindings_$"
    | "$_typeOf_$" => "$_setTypeOfBindings_$"
    | "$_typeAlias_$" => "$_setTypeAliasBindings_$"
    | _ => ""
    }

  let doBindStatement = (bindingExpr: expression, statement: expression, environment) => {
    let defaultStatement = ErrorValue.REAssignmentExpected->Error
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(IevCall(callName)), symbolExpr, statement}) => {
        let setBindingsFn = correspondingSetBindingsFn(callName)
        if setBindingsFn !== "" {
          useExpressionToSetBindings(bindingExpr, environment, statement, (
            newBindingsExpr,
            boundStatement,
          ) => eFunction(setBindingsFn, list{newBindingsExpr, symbolExpr, boundStatement}))
        } else {
          defaultStatement
        }
      }
    | _ => defaultStatement
    }
  }

  let doBindExpression = (bindingExpr: expression, statement: expression, environment): result<
    expressionWithContext,
    errorValue,
  > => {
    let defaultStatement = () =>
      useExpressionToSetBindings(bindingExpr, environment, statement, (
        _newBindingsExpr,
        boundStatement,
      ) => boundStatement)

    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(IevCall(callName)), symbolExpr, statement}) => {
        let setBindingsFn = correspondingSetBindingsFn(callName)
        if setBindingsFn !== "" {
          useExpressionToSetBindings(bindingExpr, environment, statement, (
            newBindingsExpr,
            boundStatement,
          ) =>
            eFunction(
              "$_exportBindings_$",
              list{eFunction(setBindingsFn, list{newBindingsExpr, symbolExpr, boundStatement})},
            )
          )
        } else {
          defaultStatement()
        }
      }
    | _ => defaultStatement()
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
  ) => ExpressionWithContext.noContext(eLambda(parameters, bindings, lambdaDefinition))->Ok

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
      | ExpressionValue.IevBool(false) => {
          let ifFalseBlock = eBlock(list{ifFalse})
          ExpressionWithContext.withContext(ifFalseBlock, bindings)->Ok
        }
      | ExpressionValue.IevBool(true) => {
          let ifTrueBlock = eBlock(list{ifTrue})
          ExpressionWithContext.withContext(ifTrueBlock, bindings)->Ok
        }
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
        ExpressionT.EValue(IevCall("$$_bindStatement_$$")),
        bindingExpr: ExpressionT.expression,
        statement,
      } =>
      doBindStatement(bindingExpr, statement, environment)
    | list{ExpressionT.EValue(IevCall("$$_bindStatement_$$")), statement} =>
      // bindings of the context are used when there is no binding expression
      doBindStatement(eModule(bindings), statement, environment)
    | list{
        ExpressionT.EValue(IevCall("$$_bindExpression_$$")),
        bindingExpr: ExpressionT.expression,
        expression,
      } =>
      doBindExpression(bindingExpr, expression, environment)
    | list{ExpressionT.EValue(IevCall("$$_bindExpression_$$")), expression} =>
      // bindings of the context are used when there is no binding expression
      doBindExpression(eModule(bindings), expression, environment)
    | list{ExpressionT.EValue(IevCall("$$_block_$$")), ...exprs} =>
      doBlock(exprs, bindings, environment)
    | list{
        ExpressionT.EValue(IevCall("$$_lambda_$$")),
        ExpressionT.EValue(IevArrayString(parameters)),
        lambdaDefinition,
      } =>
      doLambdaDefinition(bindings, parameters, lambdaDefinition)
    | list{ExpressionT.EValue(IevCall("$$_ternary_$$")), condition, ifTrue, ifFalse} =>
      doTernary(condition, ifTrue, ifFalse, bindings, environment)
    | _ => ExpressionWithContext.noContext(ExpressionT.EList(aList))->Ok
    }

  switch macroExpression {
  | EList(aList) => expandExpressionList(aList, bindings, environment)
  | _ => ExpressionWithContext.noContext(macroExpression)->Ok
  }
}
