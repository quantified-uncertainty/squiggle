module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

type expressionValue = Reducer_Expression.expressionValue
let evaluate = Expression.eval
let parse = Expression.parse
