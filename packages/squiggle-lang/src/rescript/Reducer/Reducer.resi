module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

@genType
type expressionValue = Reducer_Expression.expressionValue

@genType
let evaluate: string => result<expressionValue, Reducer_ErrorValue.errorValue>
let parse: string => result<Expression.expression, ErrorValue.errorValue>
