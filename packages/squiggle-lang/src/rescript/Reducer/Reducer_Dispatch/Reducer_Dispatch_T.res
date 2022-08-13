module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionT = Reducer_Expression_T

// Each piece of the dispatch chain computes the result or returns None so that the chain can continue
type dispatchChainPiece = (
  InternalExpressionValue.functionCall,
  InternalExpressionValue.environment,
) => option<result<InternalExpressionValue.t, Reducer_ErrorValue.errorValue>>

type dispatchChainPieceWithReducer = (
  InternalExpressionValue.functionCall,
  InternalExpressionValue.environment,
  ExpressionT.reducerFn,
) => option<result<InternalExpressionValue.t, Reducer_ErrorValue.errorValue>>

// This is a switch statement case implementation: get the arguments and compute the result
type genericIEvFunction = (
  array<InternalExpressionValue.t>,
  InternalExpressionValue.environment,
) => result<InternalExpressionValue.t, Reducer_ErrorValue.errorValue>
