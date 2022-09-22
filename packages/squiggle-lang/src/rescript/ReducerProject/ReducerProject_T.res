module ProjectItem = ReducerProject_ProjectItem
module ExpressionT = Reducer_Expression_T
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T

@genType.opaque
type project = {"iAmProject": bool}
//re-export
@genType
type t = project

module Private = {
  type internalProject = {
    "iAmProject": bool,
    "items": Belt.Map.String.t<ProjectItem.t>,
    "stdLib": Reducer_Bindings.t,
    "environment": ExpressionT.environment,
    "previousRunOrder": array<string>,
  }
  type t = internalProject

  @set
  external setFieldItems: (t, Belt.Map.String.t<ProjectItem.t>) => unit = "items"
  @set
  external setFieldStdLib: (t, Reducer_Bindings.t) => unit = "stdLib"
  @set
  external setFieldEnvironment: (t, ExpressionT.environment) => unit = "environment"
  @set
  external setFieldPreviousRunOrder: (t, array<string>) => unit = "previousRunOrder"

  external castFromInternalProject: t => project = "%identity"
  external castToInternalProject: project => t = "%identity"

  let getSourceIds = (this: t): array<string> => Belt.Map.String.keysToArray(this["items"])

  let getItem = (this: t, sourceId: string) =>
    Belt.Map.String.getWithDefault(this["items"], sourceId, ProjectItem.emptyItem(sourceId))
}
