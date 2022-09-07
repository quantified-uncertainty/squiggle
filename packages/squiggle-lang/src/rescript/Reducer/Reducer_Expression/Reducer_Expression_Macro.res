module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionWithContext = Reducer_ExpressionWithContext
module Result = Belt.Result
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectReducerFnT = ReducerProject_ReducerFn_T

type environment = InternalExpressionValue.environment
type expression = ExpressionT.expression
type internalExpressionValue = InternalExpressionValue.t
type expressionWithContext = ExpressionWithContext.expressionWithContext

let doMacroCall = (
  macroExpression: expression,
  bindings: ExpressionT.bindings,
  accessors: ProjectAccessorsT.t,
  reduceExpression: ProjectReducerFnT.t,
): internalExpressionValue =>
  Reducer_Dispatch_BuiltInMacros.dispatchMacroCall(
    macroExpression,
    bindings,
    (accessors: ProjectAccessorsT.t),
    (reduceExpression: ProjectReducerFnT.t),
  )->ExpressionWithContext.callReducer(bindings, accessors, reduceExpression)

let isMacroName = (fName: string): bool => fName->Js.String2.startsWith("$$")
