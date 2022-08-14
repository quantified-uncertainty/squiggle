module ProjectItem = ReducerProject_ProjectItem
module ExpressionT = Reducer_Expression_T
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T

type project = Object
type t = project

module Private = {
  type internalProject = {
    "items": Belt.Map.String.t<ProjectItem.t>,
    "stdLib": Reducer_Bindings.t,
    "environment": ExpressionT.environment,
  }
  type t = internalProject

  @set
  external setFieldItems: (t, Belt.Map.String.t<ProjectItem.t>) => unit = "items"
  @set
  external setFieldStdLib: (t, Reducer_Bindings.t) => unit = "stdLib"
  @set
  external setFieldEnvironment: (t, ExpressionT.environment) => unit = "stdLib"

  external castFromInternalProject: t => project = "%identity"
  external castToInternalProject: project => t = "%identity"

  let getSourceIds = (this: t): array<string> => Belt.Map.String.keysToArray(this["items"])

  let getItem = (this: t, sourceId: string) =>
    Belt.Map.String.getWithDefault(this["items"], sourceId, ProjectItem.emptyItem)
}
