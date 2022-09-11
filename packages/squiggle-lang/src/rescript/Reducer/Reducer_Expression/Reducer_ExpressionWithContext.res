// module Bindings = Reducer_Bindings
// module ErrorValue = Reducer_ErrorValue
// module ExpressionT = Reducer_Expression_T
// module InternalExpressionValue = ReducerInterface_InternalExpressionValue
// module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
// module Result = Belt.Result

// type bindings = Reducer_T.nameSpace
// type context = bindings
// type environment = InternalExpressionValue.environment
// type errorValue = Reducer_ErrorValue.errorValue
// type expression = ExpressionT.expression

// type expressionWithContext =
//   | ExpressionWithContext(expression, context)
//   | ExpressionNoContext(expression)

// let callReducer = (
//   expressionWithContext: expressionWithContext,
//   bindings: bindings,
//   accessors: ProjectAccessorsT.t,
//   reducer: Reducer_T.reducerFn,
// ): Reducer_T.value => {
//   switch expressionWithContext {
//   | ExpressionNoContext(expr) =>
//     // Js.log(`callReducer: bindings ${Bindings.toString(bindings)} expr ${ExpressionT.toString(expr)}`)
//     reducer(expr, bindings, accessors)
//   | ExpressionWithContext(expr, context) =>
//     // Js.log(`callReducer: context ${Bindings.toString(context)} expr ${ExpressionT.toString(expr)}`)
//     reducer(expr, context, accessors)
//   }
// }

// let withContext = (expression, context) => ExpressionWithContext(expression, context)
// let noContext = expression => ExpressionNoContext(expression)

// let toString = expressionWithContext =>
//   switch expressionWithContext {
//   | ExpressionNoContext(expr) => ExpressionT.toString(expr)
//   | ExpressionWithContext(expr, context) =>
//     `${ExpressionT.toString(expr)} context: ${context
//       ->Bindings.toExpressionValue
//       ->InternalExpressionValue.toString}`
//   }

// let toStringResult = rExpressionWithContext =>
//   switch rExpressionWithContext {
//   | Ok(expressionWithContext) => `Ok(${toString(expressionWithContext)})`
//   | Error(errorValue) => ErrorValue.errorToString(errorValue)
//   }
