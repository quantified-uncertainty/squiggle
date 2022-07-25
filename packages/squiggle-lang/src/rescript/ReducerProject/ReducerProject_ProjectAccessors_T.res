module ProjectItemT = ReducerProject_ProjectItem_T
module Bindings = Reducer_Bindings
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue

type projectAccessors = {
  stdLib: Reducer_Bindings.t,
  environment: ExpressionT.environment,
  mutable continuation: ProjectItemT.continuationArgumentType,
}

type t = projectAccessors

let identityAccessors: t = {
  continuation: Bindings.emptyBindings,
  stdLib: ReducerInterface_StdLib.internalStdLib,
  environment: InternalExpressionValue.defaultEnvironment,
}

let identityAccessorsWithEnvironment = (environment): t => {
  continuation: Bindings.emptyBindings,
  stdLib: ReducerInterface_StdLib.internalStdLib,
  environment: environment,
}
