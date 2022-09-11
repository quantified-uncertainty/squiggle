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
module Result = Belt.Result

open Reducer_Expression_ExpressionBuilder

type errorValue = ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionWithContext = ExpressionWithContext.expressionWithContext

let dispatchMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  accessors: ProjectAccessorsT.t,
  reduceExpression: ProjectReducerFnT.t,
): result<expressionWithContext, errorValue> => {
  let useExpressionToSetBindings = (bindingExpr: expression, accessors, statement, newCode) => {
    let rExternalBindingsValue = reduceExpression(bindingExpr, bindings, accessors)

    rExternalBindingsValue->Result.flatMap(nameSpaceValue => {
      let newBindings = Bindings.fromExpressionValue(nameSpaceValue)

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
    | "$_endOfOuterBlock_$" => "$_dumpBindings_$"
    | _ => ""
    }

  let doBindStatement = (bindingExpr: expression, statement: expression, accessors) => {
    let defaultStatement = ErrorValue.REAssignmentExpected->Error
    switch statement {
    | ExpressionT.EList(list{ExpressionT.EValue(IEvCall(callName)), symbolExpr, statement}) => {
        let setBindingsFn = correspondingSetBindingsFn(callName)
        if setBindingsFn !== "" {
          useExpressionToSetBindings(bindingExpr, accessors, statement, (
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

  let doBindExpression = (bindingExpr: expression, statement: expression, accessors): result<
    expressionWithContext,
    errorValue,
  > => {
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

  let doBlock = (exprs: list<expression>, _bindings: ExpressionT.bindings, _accessors): result<
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
    accessors,
  ): result<expressionWithContext, errorValue> => {
    let blockCondition = ExpressionBuilder.eBlock(list{condition})
    let rCondition = reduceExpression(blockCondition, bindings, accessors)
    rCondition->Result.flatMap(conditionValue =>
      switch conditionValue {
      | InternalExpressionValue.IEvBool(false) => {
          let ifFalseBlock = eBlock(list{ifFalse})
          ExpressionWithContext.withContext(ifFalseBlock, bindings)->Ok
        }
      | InternalExpressionValue.IEvBool(true) => {
          let ifTrueBlock = eBlock(list{ifTrue})
          ExpressionWithContext.withContext(ifTrueBlock, bindings)->Ok
        }
      | _ => REExpectedType("Boolean", "")->Error
      }
    )
  }

  let doEnvironment = (accessors: ProjectAccessorsT.t) => {
    let environment = accessors.environment
    let environmentPairs = [
      ("sampleCount", environment.sampleCount->Js.Int.toFloat->InternalExpressionValue.IEvNumber),
      (
        "xyPointLength",
        environment.xyPointLength->Js.Int.toFloat->InternalExpressionValue.IEvNumber,
      ),
    ]
    let environmentMap = Belt.Map.String.fromArray(environmentPairs)
    ExpressionWithContext.noContext(ExpressionBuilder.eRecord(environmentMap))->Ok
  }

  let doWithEnvironmentSampleCount = (
    sampleCountExpr: expression,
    expr: expression,
    bindings: ExpressionT.bindings,
    accessors: ProjectAccessorsT.t,
  ) => {
    let blockSampleCount = ExpressionBuilder.eBlock(list{sampleCountExpr})
    let rSampleCount = reduceExpression(blockSampleCount, bindings, accessors)
    rSampleCount->Result.flatMap(sampleCountValue =>
      switch sampleCountValue {
      | InternalExpressionValue.IEvNumber(sampleCount) => {
          let newEnvironment = {...accessors.environment, sampleCount: Js.Math.floor(sampleCount)}
          let newAccessors = {...accessors, environment: newEnvironment}
          reduceExpression(expr, bindings, newAccessors)->Belt.Result.map(value =>
            value->ExpressionT.EValue->ExpressionWithContext.noContext
          )
        }
      | _ => REExpectedType("Number", "")->Error
      }
    )
  }

  let expandExpressionList = (aList, bindings: ExpressionT.bindings, accessors): result<
    expressionWithContext,
    errorValue,
  > =>
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
    | list{ExpressionT.EValue(IEvCall("$$_environment_$$"))} => doEnvironment(accessors)
    | list{
        ExpressionT.EValue(IEvCall("$$_withEnvironmentSampleCount_$$")),
        expr,
        sampleCountExpr,
      } =>
      doWithEnvironmentSampleCount(sampleCountExpr, expr, bindings, accessors)
    | _ => ExpressionWithContext.noContext(ExpressionT.EList(aList))->Ok
    }

  switch macroExpression {
  | EList(aList) => expandExpressionList(aList, bindings, accessors)
  | _ => ExpressionWithContext.noContext(macroExpression)->Ok
  }
}
