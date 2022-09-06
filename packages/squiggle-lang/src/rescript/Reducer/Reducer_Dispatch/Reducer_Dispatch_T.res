module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionT = Reducer_Expression_T
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectReducerFnT = ReducerProject_ReducerFn_T

// Each piece of the dispatch chain computes the result or returns None so that the chain can continue
type dispatchChainPiece = (
  InternalExpressionValue.functionCall,
  ProjectAccessorsT.t,
) => option<result<InternalExpressionValue.t, Reducer_ErrorValue.errorValue>>

type dispatchChainPieceWithReducer = (
  InternalExpressionValue.functionCall,
  ProjectAccessorsT.t,
  ProjectReducerFnT.t,
) => option<result<InternalExpressionValue.t, Reducer_ErrorValue.errorValue>>

// This is a switch statement case implementation: get the arguments and compute the result
type genericIEvFunction = (
  array<InternalExpressionValue.t>,
  ProjectAccessorsT.t,
) => result<InternalExpressionValue.t, Reducer_ErrorValue.errorValue>
