module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

type expressionValue = Reducer_Expression.expressionValue
type externalBindings = Expression.externalBindings
let evaluate = Expression.eval
let evaluateUsingExternalBindings = Expression.evalUsingExternalBindings
let evaluatePartialUsingExternalBindings = Expression.evalPartialUsingExternalBindings
let parse = Expression.parse
let parseOuter = Expression.parseOuter
let parsePartial = Expression.parsePartial
