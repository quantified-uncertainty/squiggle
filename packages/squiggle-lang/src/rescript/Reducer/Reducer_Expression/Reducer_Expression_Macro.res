module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module ExpressionWithContext = Reducer_ExpressionWithContext
module Result = Belt.Result

type environment = ExpressionValue.environment
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type expressionWithContext = ExpressionWithContext.expressionWithContext

let expandMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  environment: environment,
  reduceExpression: ExpressionT.reducerFn,
): result<expressionWithContext, 'e> =>
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
  )->Result.flatMap(expressionWithContext =>
    ExpressionWithContext.callReducer(
      expressionWithContext,
      bindings,
      environment,
      reduceExpression,
    )
  )

let isMacroName = (fName: string): bool => fName->Js.String2.startsWith("$$")
