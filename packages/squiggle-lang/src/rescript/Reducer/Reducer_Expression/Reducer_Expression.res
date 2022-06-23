module BindingsReplacer = Reducer_Expression_BindingsReplacer
module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module Extra = Reducer_Extra
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Lambda = Reducer_Expression_Lambda
module Macro = Reducer_Expression_Macro
module MathJs = Reducer_MathJs
module Module = Reducer_Category_Module
module Result = Belt.Result
module T = Reducer_Expression_T

type environment = InternalExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = T.expression
type expressionValue = InternalExpressionValue.expressionValue
type externalExpressionValue = ReducerInterface_ExpressionValue.expressionValue
type tmpExternalBindings = InternalExpressionValue.tmpExternalBindings
type t = expression

/*
  Converts a Squigle code to expression
*/
let parse = (peggyCode: string): result<t, errorValue> =>
  peggyCode->Reducer_Peggy_Parse.parse->Result.map(Reducer_Peggy_ToExpression.fromNode)

/*
  Recursively evaluate/reduce the expression (Lisp AST)
*/
let rec reduceExpression = (expression: t, bindings: T.bindings, environment: environment): result<
  expressionValue,
  'e,
> => {
  // Js.log(`reduce: ${T.toString(expression)} bindings: ${bindings->Bindings.toString}`)
  switch expression {
  | T.EValue(value) => value->Ok
  | T.EList(list) =>
    switch list {
    | list{EValue(IevCall(fName)), ..._args} =>
      switch Macro.isMacroName(fName) {
      // A macro expands then reduces itself
      | true => Macro.doMacroCall(expression, bindings, environment, reduceExpression)
      | false => reduceExpressionList(list, bindings, environment)
      }
    | _ => reduceExpressionList(list, bindings, environment)
    }
  }
}

and reduceExpressionList = (
  expressions: list<t>,
  bindings: T.bindings,
  environment: environment,
): result<expressionValue, 'e> => {
  let racc: result<list<expressionValue>, 'e> = expressions->Belt.List.reduceReverse(Ok(list{}), (
    racc,
    each: expression,
  ) =>
    racc->Result.flatMap(acc => {
      each
      ->reduceExpression(bindings, environment)
      ->Result.map(newNode => {
        acc->Belt.List.add(newNode)
      })
    })
  )
  racc->Result.flatMap(acc => acc->reduceValueList(environment))
}

/*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
and reduceValueList = (valueList: list<expressionValue>, environment): result<
  expressionValue,
  'e,
> =>
  switch valueList {
  | list{IevCall(fName), ...args} => {
      let rCheckedArgs = switch fName {
      | "$_setBindings_$" | "$_setTypeOfBindings_$" | "$_setTypeAliasBindings_$" => args->Ok
      | _ => args->Lambda.checkIfReduced
      }

      rCheckedArgs->Result.flatMap(checkedArgs =>
        (fName, checkedArgs->Belt.List.toArray)->BuiltIn.dispatch(environment, reduceExpression)
      )
    }
  | list{IevLambda(_)} =>
    // TODO: remove on solving issue#558
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->InternalExpressionValue.IevArray->Ok
    )
  | list{IevLambda(lamdaCall), ...args} =>
    args
    ->Lambda.checkIfReduced
    ->Result.flatMap(checkedArgs =>
      Lambda.doLambdaCall(lamdaCall, checkedArgs, environment, reduceExpression)
    )

  | _ =>
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->InternalExpressionValue.IevArray->Ok
    )
  }

let evalUsingBindingsExpression_ = (aExpression, bindings, environment): result<
  expressionValue,
  'e,
> => reduceExpression(aExpression, bindings, environment)

let evaluateUsingOptions = (
  ~environment: option<ReducerInterface_ExpressionValue.environment>,
  ~externalBindings: option<ReducerInterface_ExpressionValue.externalBindings>,
  code: string,
): result<externalExpressionValue, errorValue> => {
  let anEnvironment = Belt.Option.getWithDefault(
    environment,
    ReducerInterface_ExpressionValue.defaultEnvironment,
  )

  let mergedBindings: InternalExpressionValue.nameSpace = Module.merge(
    ReducerInterface_StdLib.internalStdLib,
    Belt.Option.map(externalBindings, Module.fromTypeScriptBindings)->Belt.Option.getWithDefault(
      Module.emptyModule,
    ),
  )

  parse(code)
  ->Result.flatMap(expr => evalUsingBindingsExpression_(expr, mergedBindings, anEnvironment))
  ->Result.map(ReducerInterface_InternalExpressionValue.toExternal)
}

/*
  Ievaluates Squiggle code and bindings via Reducer and answers the result
*/
let evaluate = (code: string): result<externalExpressionValue, errorValue> => {
  evaluateUsingOptions(~environment=None, ~externalBindings=None, code)
}
let evaluatePartialUsingExternalBindings = (
  code: string,
  externalBindings: ReducerInterface_ExpressionValue.externalBindings,
  environment: ReducerInterface_ExpressionValue.environment,
): result<ReducerInterface_ExpressionValue.externalBindings, errorValue> => {
  let rAnswer = evaluateUsingOptions(
    ~environment=Some(environment),
    ~externalBindings=Some(externalBindings),
    code,
  )
  switch rAnswer {
  | Ok(EvModule(externalBindings)) => Ok(externalBindings)
  | Ok(_) =>
    Error(Reducer_ErrorValue.RESyntaxError(`Partials must end with an assignment or record`))
  | Error(err) => err->Error
  }
}
