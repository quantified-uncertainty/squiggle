// module ProjectItemT = ReducerProject_ProjectItem_T
// module InternalExpressionValue = ReducerInterface_InternalExpressionValue

// type states = {mutable continuation: ProjectItemT.continuationArgumentType}

// type projectAccessors = {
//   stdLib: Reducer_Bindings.t,
//   environment: Reducer_T.environment,
//   states: states,
// }

// type t = projectAccessors

// let identityAccessors: t = {
//   // We need the states at the end of the runtime.
//   // Accessors can be modified but states will stay as the same pointer
//   states: {
//     continuation: Reducer_Bindings.emptyBindings,
//   },
//   stdLib: ReducerInterface_StdLib.internalStdLib,
//   environment: InternalExpressionValue.defaultEnvironment,
// }

// // to support change of environment in runtime
// let setEnvironment = (this: t, environment: Reducer_T.environment): t => {
//   {
//     ...this,
//     environment: environment,
//   }
// }

