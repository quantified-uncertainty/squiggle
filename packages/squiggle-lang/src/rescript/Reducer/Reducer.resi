module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

@genType
type environment = ReducerInterface_ExpressionValue.environment
@genType
type errorValue = Reducer_ErrorValue.errorValue
@genType
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
@genType
type externalBindings = ReducerInterface_ExpressionValue.externalBindings

@genType
let evaluateUsingOptions: (
  ~environment: option<QuriSquiggleLang.ReducerInterface_ExpressionValue.environment>,
  ~externalBindings: option<QuriSquiggleLang.ReducerInterface_ExpressionValue.externalBindings>,
  string,
) => result<expressionValue, errorValue>
@genType
let evaluate: string => result<expressionValue, errorValue>

let parse: string => result<Expression.expression, errorValue>
