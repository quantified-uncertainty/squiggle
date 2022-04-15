module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

@genType
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
@genType
type externalBindings = Expression.externalBindings
@genType
let evaluate: string => result<expressionValue, Reducer_ErrorValue.errorValue>
@genType
let evaluateWBindings: (string, externalBindings) => result<expressionValue, Reducer_ErrorValue.errorValue>
let parse: string => result<Expression.expression, ErrorValue.errorValue>
