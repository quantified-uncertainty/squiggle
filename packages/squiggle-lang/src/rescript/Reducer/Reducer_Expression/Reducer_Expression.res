module Bindings = Reducer_Bindings
module BindingsReplacer = Reducer_Expression_BindingsReplacer
module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue
module Extra = Reducer_Extra
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Lambda = Reducer_Expression_Lambda
module Macro = Reducer_Expression_Macro
module MathJs = Reducer_MathJs
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module Result = Belt.Result
module T = Reducer_Expression_T

type errorValue = Reducer_ErrorValue.errorValue
type externalExpressionValue = ReducerInterface_ExternalExpressionValue.t
type t = T.t

/*
  Recursively evaluate/reduce the expression (Lisp AST/Lambda calculus)
*/
let rec reduceExpressionInProject = (
  expression: t,
  continuation: T.bindings,
  accessors: ProjectAccessorsT.t,
): result<InternalExpressionValue.t, 'e> => {
  // Js.log(`reduce: ${T.toString(expression)} bindings: ${bindings->Bindings.toString}`)
  switch expression {
  | T.EValue(value) => value->Ok
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
): result<InternalExpressionValue.t, 'e> => {
  let racc: result<
    list<InternalExpressionValue.t>,
    'e,
  > = expressions->Belt.List.reduceReverse(Ok(list{}), (racc, each: t) =>
    racc->Result.flatMap(acc => {
      each
      ->reduceExpressionInProject(continuation, accessors)
      ->Result.map(newNode => {
        acc->Belt.List.add(newNode)
      })
    })
  )
  racc->Result.flatMap(acc => acc->reduceValueList(accessors))
}

/*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
and reduceValueList = (
  valueList: list<InternalExpressionValue.t>,
  accessors: ProjectAccessorsT.t,
): result<InternalExpressionValue.t, 'e> =>
  switch valueList {
  | list{IEvCall(fName), ...args} => {
      let rCheckedArgs = switch fName {
      | "$_setBindings_$" | "$_setTypeOfBindings_$" | "$_setTypeAliasBindings_$" => args->Ok
      | _ => args->Lambda.checkIfReduced
      }

      rCheckedArgs->Result.flatMap(checkedArgs =>
        (fName, checkedArgs->Belt.List.toArray)->BuiltIn.dispatch(
          accessors,
          reduceExpressionInProject,
        )
      )
    }
  | list{IEvLambda(_)} =>
    // TODO: remove on solving issue#558
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->InternalExpressionValue.IEvArray->Ok
    )
  | list{IEvLambda(lambdaCall), ...args} =>
    args
    ->Lambda.checkIfReduced
    ->Result.flatMap(checkedArgs =>
      Lambda.doLambdaCall(lambdaCall, checkedArgs, accessors, reduceExpressionInProject)
    )

  | _ =>
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->InternalExpressionValue.IEvArray->Ok
    )
  }

let reduceReturningBindings = (
  expression: t,
  continuation: T.bindings,
  accessors: ProjectAccessorsT.t,
): (result<InternalExpressionValue.t, 'e>, T.bindings) => {
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
    expression->reduceExpressionInProject(accessors.stdLib, accessors)
  }

  let evaluateString = (peggyCode: string): result<InternalExpressionValue.t, errorValue> =>
    parse(peggyCode)->Result.flatMap(evaluate)
}
