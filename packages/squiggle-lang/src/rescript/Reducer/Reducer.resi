module Dispatch = Reducer_Dispatch
@genType
module ErrorValue = Reducer_ErrorValue
@genType
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs
@genType
let evaluate: string => result<Reducer_Expression.expressionValue, Reducer_ErrorValue.errorValue>
let parse: string => result<Expression.expression, ErrorValue.errorValue>
