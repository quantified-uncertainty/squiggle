// TODO: Auto clean project based on topology

module Bindings = Reducer_Bindings
module Continuation = ReducerInterface_Value_Continuation
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectItem = ReducerProject_ProjectItem
module T = ReducerProject_T
module Topology = ReducerProject_Topology

type t = T.t

module Private = {
  type internalProject = T.Private.t
  type t = T.Private.t

  let getSourceIds = T.Private.getSourceIds
  let getItem = T.Private.getItem
  let getDependents = Topology.getDependents
  let getDependencies = Topology.getDependencies
  let getRunOrder = Topology.getRunOrder
  let getRunOrderFor = Topology.getRunOrderFor

  let createProject = () => {
    let project: t = {
      "tag": "reducerProject",
      "items": Belt.Map.String.empty,
      "stdLib": ReducerInterface_StdLib.internalStdLib,
      "environment": InternalExpressionValue.defaultEnvironment,
    }
    project
  }

  let rec touchSource = (project: t, sourceId: string): unit => {
    let item = project->getItem(sourceId)
    let newItem = ProjectItem.touchSource(item)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
    touchDependents(project, sourceId)
  }
  and touchDependents = (project: t, sourceId: string): unit => {
    let _ = getDependents(project, sourceId)->Belt.Array.forEach(_, touchSource(project, _))
  }

  let getSource = (project: t, sourceId: string): option<string> =>
    Belt.Map.String.get(project["items"], sourceId)->Belt.Option.map(ProjectItem.getSource)

  let setSource = (project: t, sourceId: string, value: string): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.setSource(value)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
    touchDependents(project, sourceId)
  }

  let clean = (project: t, sourceId: string): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.clean
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let cleanAll = (project: t): unit =>
    getSourceIds(project)->Belt.Array.forEach(sourceId => clean(project, sourceId))

  let cleanResults = (project: t, sourceId: string): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.cleanResults
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let cleanAllResults = (project: t): unit =>
    getSourceIds(project)->Belt.Array.forEach(sourceId => cleanResults(project, sourceId))

  let getIncludes = (project: t, sourceId: string): ProjectItem.T.includesType =>
    project->getItem(sourceId)->ProjectItem.getIncludes

  let setContinues = (project: t, sourceId: string, continues: array<string>): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.setContinues(continues)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
    touchSource(project, sourceId)
  }
  let getContinues = (project: t, sourceId: string): array<string> =>
    ProjectItem.getContinues(project->getItem(sourceId))

  let removeContinues = (project: t, sourceId: string): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.removeContinues
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
    touchSource(project, sourceId)
  }

  let getContinuation = (project: t, sourceId: string): ProjectItem.T.continuationArgumentType =>
    project->getItem(sourceId)->ProjectItem.getContinuation

  let setContinuation = (
    project: t,
    sourceId: string,
    continuation: ProjectItem.T.continuationArgumentType,
  ): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.setContinuation(continuation)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let getResultOption = (project: t, sourceId: string): ProjectItem.T.resultType =>
    project->getItem(sourceId)->ProjectItem.getResult

  let getResult = (project: t, sourceId: string): ProjectItem.T.resultArgumentType =>
    switch getResultOption(project, sourceId) {
    | None => RENeedToRun->Error
    | Some(result) => result
    }

  let setResult = (project: t, sourceId: string, value: ProjectItem.T.resultArgumentType): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.setResult(value)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let parseIncludes = (project: t, sourceId: string): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.parseIncludes
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let rawParse = (project: t, sourceId): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.rawParse
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let getStdLib = (project: t): Reducer_Bindings.t => project["stdLib"]
  let setStdLib = (project: t, value: Reducer_Bindings.t): unit =>
    T.Private.setFieldStdLib(project, value)

  let getEnvironment = (project: t): InternalExpressionValue.environment => project["environment"]
  let setEnvironment = (project: t, value: InternalExpressionValue.environment): unit =>
    T.Private.setFieldEnvironment(project, value)

  let getBindings = (project: t, sourceId: string): ProjectItem.T.bindingsArgumentType => {
    let those = project->getContinuation(sourceId)
    let these = project->getStdLib
    let ofUser = Continuation.minus(those, these)
    ofUser
  }

  let buildProjectAccessors = (project: t): ProjectAccessorsT.t => {
    states: {continuation: Bindings.emptyBindings},
    stdLib: getStdLib(project),
    environment: getEnvironment(project),
  }

  let doRunWithContinuation = (
    project: t,
    sourceId: string,
    continuation: ProjectItem.T.continuation,
  ): unit => {
    let accessors = buildProjectAccessors(project)
    let states = accessors.states
    let newItem = project->getItem(sourceId)->ProjectItem.run(continuation, accessors)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
    setContinuation(project, sourceId, states.continuation)
  }

  type runState = (ProjectItem.T.resultArgumentType, ProjectItem.T.continuation)

  let tryRunWithContinuation = (
    project: t,
    sourceId: string,
    (rPrevResult: ProjectItem.T.resultArgumentType, continuation: ProjectItem.T.continuation),
  ): (ProjectItem.T.resultArgumentType, ProjectItem.T.continuation) => {
    switch getResultOption(project, sourceId) {
    | Some(result) => (result, getContinuation(project, sourceId)) // already ran
    | None =>
      switch rPrevResult {
      | Error(error) => {
          setResult(project, sourceId, Error(error))
          (Error(error), continuation)
        }
      | Ok(_prevResult) => {
          doRunWithContinuation(project, sourceId, continuation)
          (
            getResultOption(project, sourceId)->Belt.Option.getWithDefault(rPrevResult),
            getContinuation(project, sourceId),
          )
        }
      }
    }
  }

  let runAll = (project: t): unit => {
    let runOrder = Topology.getRunOrder(project)
    let initialState = (Ok(InternalExpressionValue.IEvVoid), getStdLib(project))
    let _finalState = Belt.Array.reduce(runOrder, initialState, (currState, currId) =>
      tryRunWithContinuation(project, currId, currState)
    )
  }

  let run = (project: t, sourceId: string): unit => {
    let runOrder = Topology.getRunOrderFor(project, sourceId)
    let initialState = (Ok(InternalExpressionValue.IEvVoid), getStdLib(project))
    let _finalState = Belt.Array.reduce(runOrder, initialState, (currState, currId) =>
      tryRunWithContinuation(project, currId, currState)
    )
  }

  let evaluate = (sourceCode: string) => {
    let project = createProject()
    setSource(project, "main", sourceCode)
    runAll(project)
    let those = project->getContinuation("main")
    let these = project->getStdLib
    let ofUser = Continuation.minus(those, these)

    (getResultOption(project, "main")->Belt.Option.getWithDefault(IEvVoid->Ok), ofUser)
  }
}
