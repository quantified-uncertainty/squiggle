module ProjectItemT = ReducerProject_ProjectItem_T
module Bindings = Reducer_Bindings
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue

type states = {mutable continuation: ProjectItemT.continuationArgumentType}

type projectAccessors = {
  stdLib: Reducer_Bindings.t,
  environment: ExpressionT.environment,
  states: states,
}

type t = projectAccessors

let identityAccessors: t = {
  // We need the states at the end of the runtime.
  // Accessors can be modified but states will stay as the same pointer
  states: {
    continuation: Bindings.emptyBindings,
  },
  stdLib: ReducerInterface_StdLib.internalStdLib,
  environment: InternalExpressionValue.defaultEnvironment,
}

let identityAccessorsWithEnvironment = (environment): t => {
  states: {
    continuation: Bindings.emptyBindings,
  },
  stdLib: ReducerInterface_StdLib.internalStdLib,
  environment: environment,
}

// to support change of environment in runtime
let setEnvironment = (this: t, environment: ExpressionT.environment): t => {
  {
    ...this,
    environment: environment,
  }
}
