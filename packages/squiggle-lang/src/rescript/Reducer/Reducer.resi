module Dispatch = Reducer_Dispatch
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module Extra = Reducer_Extra
module Js = Reducer_Js
module MathJs = Reducer_MathJs

@genType
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
@genType
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
@genType
let evaluate: string => result<expressionValue, Reducer_ErrorValue.errorValue>
@genType
let evaluateUsingExternalBindings: (
  string,
  externalBindings,
) => result<expressionValue, Reducer_ErrorValue.errorValue>
@genType
let evaluatePartialWBindings: (
  string,
  externalBindings,
) => result<externalBindings, Reducer_ErrorValue.errorValue>
let parse: string => result<Expression.expression, ErrorValue.errorValue>
let parseOuter: string => result<Expression.expression, ErrorValue.errorValue>
let parsePartial: string => result<Expression.expression, ErrorValue.errorValue>
