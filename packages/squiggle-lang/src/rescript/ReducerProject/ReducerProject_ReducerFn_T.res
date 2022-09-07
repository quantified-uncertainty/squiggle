module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T

type t = (
  ExpressionT.t,
  ExpressionT.bindings,
  ProjectAccessorsT.t,
) => InternalExpressionValue.t
