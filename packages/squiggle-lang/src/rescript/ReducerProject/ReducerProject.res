// TODO: Auto clean project based on topology

module Bindings = Reducer_Bindings
module Continuation = ReducerInterface_Value_Continuation
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectItem = ReducerProject_ProjectItem
module T = ReducerProject_T
module Topology = ReducerProject_Topology

type t = T.t

let getItem = T.getItem
let getSourceIds = T.getSourceIds
let getDependents = Topology.getDependents
let getDependencies = Topology.getDependencies
let getRunOrder = Topology.getRunOrder
let getRunOrderFor = Topology.getRunOrderFor

let createProject = () => {
  let project: t = {
    items: Belt.MutableMap.String.make(),
    stdLib: ReducerInterface_StdLib.internalStdLib,
    environment: InternalExpressionValue.defaultEnvironment,
    previousRunOrder: [],
  }
  project
}

// will not be necessary when ProjectItem becomes mutable
let setItem = (project: t, sourceId: string, item: ProjectItem.t): unit => {
  let _ = Belt.MutableMap.String.set(project.items, sourceId, item)
}

let rec touchSource_ = (project: t, sourceId: string): unit => {
  let item = project->getItem(sourceId)
  let newItem = ProjectItem.touchSource(item)
  project->setItem(sourceId, newItem)
}
and touchDependents = (project: t, sourceId: string): unit => {
  let _ = getDependents(project, sourceId)->Belt.Array.forEach(_, touchSource_(project, _))
}

let touchSource = (project: t, sourceId: string): unit => {
  touchSource_(project, sourceId)
  touchDependents(project, sourceId)
}

let handleNewTopology = (project: t): unit => {
  let previousRunOrder = project.previousRunOrder
  let currentRunOrder = Topology.getRunOrder(project)
  let diff = Topology.runOrderDiff(currentRunOrder, previousRunOrder)
  Belt.Array.forEach(diff, touchSource(project, _))
  project.previousRunOrder = currentRunOrder
}

let getSource = (project: t, sourceId: string): option<string> =>
  Belt.MutableMap.String.get(project.items, sourceId)->Belt.Option.map(ProjectItem.getSource)

let setSource = (project: t, sourceId: string, value: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.setSource(value)
  project->setItem(sourceId, newItem)
  touchDependents(project, sourceId)
}

let clean = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.clean
  project->setItem(sourceId, newItem)
}

let cleanAll = (project: t): unit =>
  project->getSourceIds->Belt.Array.forEach(sourceId => clean(project, sourceId))

let cleanResults = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.cleanResults
  project->setItem(sourceId, newItem)
}

let cleanAllResults = (project: t): unit =>
  project->getSourceIds->Belt.Array.forEach(sourceId => project->cleanResults(sourceId))

let getIncludes = (project: t, sourceId: string): ProjectItem.T.includesType =>
  project->getItem(sourceId)->ProjectItem.getIncludes

let getPastChain = (project: t, sourceId: string): array<string> =>
  project->getItem(sourceId)->ProjectItem.getPastChain

let getIncludesAsVariables = (
  project: t,
  sourceId: string,
): ProjectItem.T.importAsVariablesType =>
  project->getItem(sourceId)->ProjectItem.getIncludesAsVariables

let getDirectIncludes = (project: t, sourceId: string): array<string> =>
  project->getItem(sourceId)->ProjectItem.getDirectIncludes

let setContinues = (project: t, sourceId: string, continues: array<string>): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.setContinues(continues)
  project->setItem(sourceId, newItem)
  handleNewTopology(project)
}
let getContinues = (project: t, sourceId: string): array<string> =>
  ProjectItem.getContinues(project->getItem(sourceId))

let removeContinues = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.removeContinues
  project->setItem(sourceId, newItem)
  handleNewTopology(project)
}

let getContinuation = (project: t, sourceId: string): ProjectItem.T.continuationArgumentType =>
  project->getItem(sourceId)->ProjectItem.getContinuation

let setContinuation = (
  project: t,
  sourceId: string,
  continuation: ProjectItem.T.continuationArgumentType,
): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.setContinuation(continuation)
  project->setItem(sourceId, newItem)
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
  project->setItem(sourceId, newItem)
}

let parseIncludes = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.parseIncludes
  project->setItem(sourceId, newItem)
  handleNewTopology(project)
}

let rawParse = (project: t, sourceId): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.rawParse
  project->setItem(sourceId, newItem)
}

let getStdLib = (project: t): Reducer_Bindings.t => project.stdLib
let setStdLib = (project: t, value: Reducer_Bindings.t): unit => {
  project.stdLib = value
}

let getEnvironment = (project: t): InternalExpressionValue.environment => project.environment
let setEnvironment = (project: t, value: InternalExpressionValue.environment): unit => {
  project.environment = value
}

let getBindings = (project: t, sourceId: string): ProjectItem.T.bindingsArgumentType => {
  project->getContinuation(sourceId) // TODO - locals method for cleaning parent?
}

let getContinuationsBefore = (project: t, sourceId: string): array<
  ProjectItem.T.continuation,
> => {
  let pastNameSpaces = project->getPastChain(sourceId)->Js.Array2.map(getBindings(project, _))
  let theLength = pastNameSpaces->Js.Array2.length
  if theLength == 0 {
    // `getContinuationBefore ${sourceId}: stdLib`->Js.log
    [project->getStdLib]
  } else {
    // `getContinuationBefore ${sourceId}: ${lastOne} = ${InternalExpressionValue.toStringBindings(
    //     project->getBindings(lastOne),
    //   )}`->Js.log
    pastNameSpaces
  }
}

let linkDependencies = (project: t, sourceId: string): ProjectItem.T.continuation => {
  let continuationsBefore = project->getContinuationsBefore(sourceId)
  let nameSpace = Reducer_Bindings.makeEmptyBindings()->Reducer_Bindings.chainTo(continuationsBefore)
  let includesAsVariables = project->getIncludesAsVariables(sourceId)
  Belt.Array.reduce(includesAsVariables, nameSpace, (currentNameSpace, (variable, includeFile)) =>
    Bindings.set(
      currentNameSpace,
      variable,
      getBindings(project, includeFile)->Reducer_T.IEvBindings,
    )
  )
}

let doLinkAndRun = (project: t, sourceId: string): unit => {
  let context = Reducer_Context.createContext(project->getStdLib, project->getEnvironment)
  // FIXME: fill context with dependencies
  // let continuation = linkDependencies(project, sourceId)
  let newItem = project->getItem(sourceId)->ProjectItem.run(context)
  Js.log("after run " ++ newItem.continuation->Reducer_Bindings.toString)
  project->setItem(sourceId, newItem)
}

type runState = ProjectItem.T.resultArgumentType

let tryRunWithResult = (
  project: t,
  sourceId: string,
  rPrevResult: ProjectItem.T.resultArgumentType,
): ProjectItem.T.resultArgumentType => {
  switch getResultOption(project, sourceId) {
  | Some(result) => result // already ran
  | None =>
    switch rPrevResult {
    | Error(error) => {
        setResult(project, sourceId, Error(error))
        Error(error)
      }
    | Ok(_prevResult) => {
        doLinkAndRun(project, sourceId)
        getResultOption(project, sourceId)->Belt.Option.getWithDefault(rPrevResult)
      }
    }
  }
}

let runAll = (project: t): unit => {
  let runOrder = Topology.getRunOrder(project)
  let initialState = Ok(Reducer_T.IEvVoid)
  let _finalState = Belt.Array.reduce(runOrder, initialState, (currState, currId) =>
    tryRunWithResult(project, currId, currState)
  )
}

let run = (project: t, sourceId: string): unit => {
  let runOrder = Topology.getRunOrderFor(project, sourceId)
  let initialState = Ok(Reducer_T.IEvVoid)
  let _finalState = Belt.Array.reduce(runOrder, initialState, (currState, currId) =>
    tryRunWithResult(project, currId, currState)
  )
}

let evaluate = (sourceCode: string) => {
  let project = createProject()
  setSource(project, "main", sourceCode)
  runAll(project)

  (
    getResultOption(project, "main")->Belt.Option.getWithDefault(
      Reducer_T.IEvVoid->Ok,
    ),
    project->getBindings("main")
  )
}
