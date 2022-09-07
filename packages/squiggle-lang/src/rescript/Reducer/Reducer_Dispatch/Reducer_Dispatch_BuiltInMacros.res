/*
  Macros are like functions but instead of taking values as parameters,
  they take expressions as parameters and return a new expression.
  Macros are used to define language building blocks. They are like Lisp macros.
*/
module Bindings = Reducer_Bindings
module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ErrorValue = Reducer_ErrorValue
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionWithContext = Reducer_ExpressionWithContext
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectReducerFnT = ReducerProject_ReducerFn_T

open Reducer_Expression_ExpressionBuilder

exception ErrorException = ErrorValue.ErrorException
type expression = ExpressionT.expression
type expressionWithContext = ExpressionWithContext.expressionWithContext

let dispatchMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  accessors: ProjectAccessorsT.t,
  reduceExpression: ProjectReducerFnT.t,
): expressionWithContext => {
  let useExpressionToSetBindings = (bindingExpr: expression, accessors, statement, newCode) => {
    let nameSpaceValue = reduceExpression(bindingExpr, bindings, accessors)

    let newBindings = Bindings.fromExpressionValue(nameSpaceValue)

    let boundStatement = BindingsReplacer.replaceSymbols(newBindings, statement)

    ExpressionWithContext.withContext(
      newCode(newBindings->eModule, boundStatement),
      newBindings,
    )
  }

  let correspondingSetBindingsFn = (fnName: string): string =>
    switch fnName {
    | "$_let_$" => "$_setBindings_$"
    | "$_typeOf_$" => "$_setTypeOfBindings_$"
    | "$_typeAlias_$" => "$_setTypeAliasBindings_$"
    | "$_endOfOuterBlock_$" => "$_dumpBindings_$"
    | _ => ""
    }

  let doBindStatement = (bindingExpr: expression, statement: expression, accessors) => {
    let defaultStatement = ErrorValue.REAssignmentExpected->ErrorException
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(IEvCall(callName)), symbolExpr, statement}) => {
        let setBindingsFn = correspondingSetBindingsFn(callName)
        if setBindingsFn !== "" {
          useExpressionToSetBindings(bindingExpr, accessors, statement, (
            newBindingsExpr,
            boundStatement,
          ) => eFunction(setBindingsFn, list{newBindingsExpr, symbolExpr, boundStatement}))
        } else {
          raise(defaultStatement)
        }
      }
    | _ => raise(defaultStatement)
    }
  }

  let doBindExpression = (bindingExpr: expression, statement: expression, accessors): expressionWithContext => {
    let defaultStatement = () =>
      useExpressionToSetBindings(bindingExpr, accessors, statement, (
        _newBindingsExpr,
        boundStatement,
      ) => boundStatement)

    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(IEvCall(callName)), symbolExpr, statement}) => {
        let setBindingsFn = correspondingSetBindingsFn(callName)
        if setBindingsFn !== "" {
          useExpressionToSetBindings(bindingExpr, accessors, statement, (
            newBindingsExpr,
            boundStatement,
          ) =>
            eFunction(
              "$_exportBindings_$",
              list{eFunction(setBindingsFn, list{newBindingsExpr, symbolExpr, boundStatement})}, // expression returning bindings
            )
          )
        } else {
          defaultStatement()
        }
      }
    | _ => defaultStatement()
    }
  }

  let doBlock = (exprs: list<expression>, _bindings: ExpressionT.bindings, _accessors): expressionWithContext => {
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
    ExpressionWithContext.noContext(newStatement)
  }

  let doLambdaDefinition = (
    bindings: ExpressionT.bindings,
    parameters: array<string>,
    lambdaDefinition: ExpressionT.expression,
  ) => ExpressionWithContext.noContext(eLambda(parameters, bindings, lambdaDefinition))

  let doTernary = (
    condition: expression,
    ifTrue: expression,
    ifFalse: expression,
    bindings: ExpressionT.bindings,
    accessors,
  ): expressionWithContext => {
    let blockCondition = ExpressionBuilder.eBlock(list{condition})
    let conditionValue = reduceExpression(blockCondition, bindings, accessors)

    switch conditionValue {
    | InternalExpressionValue.IEvBool(false) => {
        let ifFalseBlock = eBlock(list{ifFalse})
        ExpressionWithContext.withContext(ifFalseBlock, bindings)
      }
    | InternalExpressionValue.IEvBool(true) => {
        let ifTrueBlock = eBlock(list{ifTrue})
        ExpressionWithContext.withContext(ifTrueBlock, bindings)
      }
    | _ => raise(ErrorException(REExpectedType("Boolean", "")))
    }
  }

  let expandExpressionList = (aList, bindings: ExpressionT.bindings, accessors): expressionWithContext
   =>
    switch aList {
    | list{
        ExpressionT.EValue(IEvCall("$$_bindStatement_$$")),
        bindingExpr: ExpressionT.expression,
        statement,
      } =>
      doBindStatement(bindingExpr, statement, accessors)
    | list{ExpressionT.EValue(IEvCall("$$_bindStatement_$$")), statement} =>
      // bindings of the context are used when there is no binding expression
      doBindStatement(eModule(bindings), statement, accessors)
    | list{
        ExpressionT.EValue(IEvCall("$$_bindExpression_$$")),
        bindingExpr: ExpressionT.expression,
        expression,
      } =>
      doBindExpression(bindingExpr, expression, accessors)
    | list{ExpressionT.EValue(IEvCall("$$_bindExpression_$$")), expression} =>
      // bindings of the context are used when there is no binding expression
      doBindExpression(eModule(bindings), expression, accessors)
    | list{ExpressionT.EValue(IEvCall("$$_block_$$")), ...exprs} =>
      doBlock(exprs, bindings, accessors)
    | list{
        ExpressionT.EValue(IEvCall("$$_lambda_$$")),
        ExpressionT.EValue(IEvArrayString(parameters)),
        lambdaDefinition,
      } =>
      doLambdaDefinition(bindings, parameters, lambdaDefinition)
    | list{ExpressionT.EValue(IEvCall("$$_ternary_$$")), condition, ifTrue, ifFalse} =>
      doTernary(condition, ifTrue, ifFalse, bindings, accessors)
    | _ => ExpressionWithContext.noContext(ExpressionT.EList(aList))
    }

  switch macroExpression {
  | EList(aList) => expandExpressionList(aList, bindings, accessors)
  | _ => ExpressionWithContext.noContext(macroExpression)
  }
}
