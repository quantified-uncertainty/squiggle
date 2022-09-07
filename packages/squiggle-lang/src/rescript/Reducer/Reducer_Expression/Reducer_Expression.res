module Bindings = Reducer_Bindings
module BindingsReplacer = Reducer_Expression_BindingsReplacer
module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module Extra = Reducer_Extra
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Lambda = Reducer_Expression_Lambda
module Macro = Reducer_Expression_Macro
module MathJs = Reducer_MathJs
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module Result = Belt.Result
module T = Reducer_Expression_T

type errorValue = Reducer_ErrorValue.errorValue
type t = T.t

exception ErrorException = Reducer_ErrorValue.ErrorException

/*
  Recursively evaluate/reduce the expression (Lisp AST/Lambda calculus)
*/
let rec reduceExpressionInProject = (
  expression: t,
  continuation: T.bindings,
  accessors: ProjectAccessorsT.t,
): InternalExpressionValue.t => {
  // Js.log(`reduce: ${T.toString(expression)} bindings: ${bindings->Bindings.toString}`)
  switch expression {
  | T.EValue(value) => value
  | T.EList(list) =>
    switch list {
    | list{EValue(IEvCall(fName)), ..._args} =>
      switch Macro.isMacroName(fName) {
      // A macro expands then reduces itself
      | true => Macro.doMacroCall(expression, continuation, accessors, reduceExpressionInProject)
      | false => reduceExpressionList(list, continuation, accessors)
      }
    | _ => reduceExpressionList(list, continuation, accessors)
    }
  }
}
and reduceExpressionList = (
  expressions: list<t>,
  continuation: T.bindings,
  accessors: ProjectAccessorsT.t,
): InternalExpressionValue.t => {
  let acc: list<InternalExpressionValue.t> = expressions->Belt.List.reduceReverse(list{}, (acc, each: t) =>
    acc->Belt.List.add(
      each->reduceExpressionInProject(continuation, accessors)
    )
  )
  acc->reduceValueList(accessors)
}

/*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
and reduceValueList = (
  valueList: list<InternalExpressionValue.t>,
  accessors: ProjectAccessorsT.t,
): InternalExpressionValue.t =>
  switch valueList {
  | list{IEvCall(fName), ...args} => {
      let checkedArgs = switch fName {
      | "$_setBindings_$" | "$_setTypeOfBindings_$" | "$_setTypeAliasBindings_$" => args
      | _ => args->Lambda.checkIfReduced
      }

      (fName, checkedArgs->Belt.List.toArray)->BuiltIn.dispatch(
        accessors,
        reduceExpressionInProject,
      )
    }
  | list{IEvLambda(_)} =>
    // TODO: remove on solving issue#558
    valueList
    ->Lambda.checkIfReduced
    ->Belt.List.toArray->InternalExpressionValue.IEvArray
  | list{IEvLambda(lambdaCall), ...args} =>
    args
    ->Lambda.checkIfReduced
    ->Lambda.doLambdaCall(lambdaCall, _, accessors, reduceExpressionInProject)
  | _ =>
    valueList
    ->Lambda.checkIfReduced
    ->Belt.List.toArray->InternalExpressionValue.IEvArray
  }

let reduceReturningBindings = (
  expression: t,
  continuation: T.bindings,
  accessors: ProjectAccessorsT.t,
): (InternalExpressionValue.t, T.bindings) => {
  let states = accessors.states
  let result = reduceExpressionInProject(expression, continuation, accessors)
  (result, states.continuation)
}

module BackCompatible = {
  // Those methods are used to support the existing tests
  // If they are used outside limited testing context, error location reporting will fail
  let parse = (peggyCode: string): result<t, errorValue> =>
    peggyCode->Reducer_Peggy_Parse.parse->Result.map(Reducer_Peggy_ToExpression.fromNode)

  let evaluate = (expression: t): result<InternalExpressionValue.t, errorValue> => {
    let accessors = ProjectAccessorsT.identityAccessors
    try {
      expression->reduceExpressionInProject(accessors.stdLib, accessors)->Ok
    } catch {
    | ErrorException(e) => Error(e)
    | _ => raise(ErrorException(RETodo("internal exception")))
    }
  }

  let evaluateString = (peggyCode: string): result<InternalExpressionValue.t, errorValue> =>
    parse(peggyCode)->Result.flatMap(evaluate)
}
