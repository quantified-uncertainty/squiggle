module ProjectItem = ReducerProject_ProjectItem

@genType.opaque
type project = {
  items: Belt.MutableMap.String.t<ProjectItem.t>,
  mutable stdLib: Reducer_Namespace.t,
  mutable environment: Reducer_T.environment,
  mutable previousRunOrder: array<string>,
}
type t = project

// these functions are used in ReducerProject_Topology, so they are defined here to avoid circular dependencies
let getSourceIds = (project: t): array<string> => Belt.MutableMap.String.keysToArray(project.items)

let getItem = (project: t, sourceId: string) =>
  Belt.MutableMap.String.getWithDefault(project.items, sourceId, ProjectItem.emptyItem(sourceId))
