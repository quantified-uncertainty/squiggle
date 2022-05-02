module Bindings = Reducer_Expression_Bindings
module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result

type bindings = ExpressionT.bindings
type context = bindings
type environment = ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
type reducerFn = ExpressionT.reducerFn

type expressionWithContext =
  | ExpressionWithContext(expression, context)
  | ExpressionNoContext(expression)

let callReducer = (
  expressionWithContext: expressionWithContext,
  bindings: bindings,
  environment: environment,
  reducer: reducerFn,
): result<expressionValue, errorValue> =>
  switch expressionWithContext {
  | ExpressionNoContext(expr) => reducer(expr, bindings, environment)
  | ExpressionWithContext(expr, context) => reducer(expr, context, environment)
  }

let withContext = (expression, context) => ExpressionWithContext(expression, context)
let noContext = expression => ExpressionNoContext(expression)

let toString = expressionWithContext =>
  switch expressionWithContext {
  | ExpressionNoContext(expr) => ExpressionT.toString(expr)
  | ExpressionWithContext(expr, context) =>
    `${ExpressionT.toString(expr)} context: ${Bindings.toString(context)}`
  }

let toStringResult = rExpressionWithContext =>
  switch rExpressionWithContext {
  | Ok(expressionWithContext) => `Ok(${toString(expressionWithContext)})`
  | Error(errorValue) => ErrorValue.errorToString(errorValue)
  }
