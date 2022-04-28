module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

type environment = ReducerInterface_ExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
let evaluate = Expression.evaluate
let evaluateUsingOptions = Expression.evaluateUsingOptions
let parse = Expression.parse
