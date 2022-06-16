module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface_InternalExpressionValue
module Result = Belt.Result
module Module = Reducer_Category_Module

type bindings = ExpressionT.bindings
type context = bindings
type environment = ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type reducerFn = ExpressionT.reducerFn

type expressionWithContext =
  | ExpressionWithContext(expression, context)
  | ExpressionNoContext(expression)

let callReducer = (
  expressionWithContext: expressionWithContext,
  bindings: bindings,
  environment: environment,
  reducer: reducerFn,
): result<expressionValue, errorValue> => {
  switch expressionWithContext {
  | ExpressionNoContext(expr) =>
    // Js.log(`callReducer: bindings ${Bindings.toString(bindings)} expr ${ExpressionT.toString(expr)}`)
    reducer(expr, bindings, environment)
  | ExpressionWithContext(expr, context) =>
    // Js.log(`callReducer: context ${Bindings.toString(context)} expr ${ExpressionT.toString(expr)}`)
    reducer(expr, context, environment)
  }
}

let withContext = (expression, context) => ExpressionWithContext(expression, context)
let noContext = expression => ExpressionNoContext(expression)

let toString = expressionWithContext =>
  switch expressionWithContext {
  | ExpressionNoContext(expr) => ExpressionT.toString(expr)
  | ExpressionWithContext(expr, context) =>
    `${ExpressionT.toString(expr)} context: ${context
      ->Module.toExpressionValue
      ->ExpressionValue.toString}`
  }

let toStringResult = rExpressionWithContext =>
  switch rExpressionWithContext {
  | Ok(expressionWithContext) => `Ok(${toString(expressionWithContext)})`
  | Error(errorValue) => ErrorValue.errorToString(errorValue)
  }
