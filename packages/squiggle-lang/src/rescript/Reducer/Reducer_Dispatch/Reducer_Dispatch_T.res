// module InternalExpressionValue = ReducerInterface_InternalExpressionValue
// module ExpressionT = Reducer_Expression_T
// module ProjectAccessorsT = ReducerProject_ProjectAccessors_T

// // Each piece of the dispatch chain computes the result or returns None so that the chain can continue
// type dispatchChainPiece = (
//   InternalExpressionValue.functionCall,
//   ProjectAccessorsT.t,
// ) => option<result<Reducer_T.value, Reducer_ErrorValue.errorValue>>

// type dispatchChainPieceWithReducer = (
//   InternalExpressionValue.functionCall,
//   ProjectAccessorsT.t,
//   Reducer_T.reducerFn,
// ) => option<result<Reducer_T.value, Reducer_ErrorValue.errorValue>>

// // This is a switch statement case implementation: get the arguments and compute the result
// type genericIEvFunction = (
//   array<Reducer_T.value>,
//   ProjectAccessorsT.t,
// ) => result<Reducer_T.value, Reducer_ErrorValue.errorValue>

