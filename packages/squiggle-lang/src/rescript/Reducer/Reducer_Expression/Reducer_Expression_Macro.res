module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result

type environment = ExpressionValue.environment
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue

let expandMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  environment: environment,
  reduceExpression: ExpressionT.reducerFn,
): result<expression, 'e> =>
  Reducer_Dispatch_BuiltInMacros.dispatchMacroCall(
    macroExpression,
    bindings,
    environment,
    reduceExpression,
  )

let doMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  environment: environment,
  reduceExpression: ExpressionT.reducerFn,
): result<expressionValue, 'e> =>
  expandMacroCall(
    macroExpression,
    bindings,
    environment,
    reduceExpression,
  )->Result.flatMap(expression => reduceExpression(expression, bindings, environment))

let isMacroName = (fName: string): bool => fName->Js.String2.startsWith("$$")
