// TODO: Auto clean project based on topology

module Bindings = Reducer_Bindings
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
    stdLib: SquiggleLibrary_StdLib.stdLib,
    environment: Reducer_Context.defaultEnvironment,
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
  let _ = getDependents(project, sourceId)->E.A.forEach(_, touchSource_(project, _))
}

let touchSource = (project: t, sourceId: string): unit => {
  touchSource_(project, sourceId)
  touchDependents(project, sourceId)
}

let handleNewTopology = (project: t): unit => {
  let previousRunOrder = project.previousRunOrder
  let currentRunOrder = Topology.getRunOrder(project)
  let diff = Topology.runOrderDiff(currentRunOrder, previousRunOrder)
  E.A.forEach(diff, touchSource(project, _))
  project.previousRunOrder = currentRunOrder
}

let getSource = (project: t, sourceId: string): option<string> =>
  Belt.MutableMap.String.get(project.items, sourceId)->Belt.Option.map(ProjectItem.getSource)

let setSource = (project: t, sourceId: string, value: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.setSource(value)
  project->setItem(sourceId, newItem)
  touchDependents(project, sourceId)
}

let removeSource = (project: t, sourceId: string): unit => {
  Belt.MutableMap.String.remove(project.items, sourceId)
}

let clean = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.clean
  project->setItem(sourceId, newItem)
}

let cleanAll = (project: t): unit =>
  project->getSourceIds->E.A.forEach(sourceId => clean(project, sourceId))

let cleanResults = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.cleanResults
  project->setItem(sourceId, newItem)
}

let cleanAllResults = (project: t): unit =>
  project->getSourceIds->E.A.forEach(sourceId => project->cleanResults(sourceId))

let getIncludes = (project: t, sourceId: string): ProjectItem.T.includesType =>
  project->getItem(sourceId)->ProjectItem.getIncludes

let getPastChain = (project: t, sourceId: string): array<string> =>
  project->getItem(sourceId)->ProjectItem.getPastChain

let getIncludesAsVariables = (project: t, sourceId: string): ProjectItem.T.importAsVariablesType =>
  project->getItem(sourceId)->ProjectItem.getIncludesAsVariables

let getDirectIncludes = (project: t, sourceId: string): array<string> =>
  project->getItem(sourceId)->ProjectItem.getDirectIncludes

let setContinues = (project: t, sourceId: string, continues: array<string>): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.setContinues(continues)
  project->setItem(sourceId, newItem)
  handleNewTopology(project)
}
let getContinues = (project: t, sourceId: string): array<string> =>
  project->getItem(sourceId)->ProjectItem.getContinues

let removeContinues = (project: t, sourceId: string): unit => {
  let newItem = project->getItem(sourceId)->ProjectItem.removeContinues
  project->setItem(sourceId, newItem)
  handleNewTopology(project)
}

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
  | None => RENeedToRun->SqError.fromMessage->Error
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

let getStdLib = (project: t): Reducer_T.namespace => project.stdLib
let setStdLib = (project: t, value: Reducer_T.namespace): unit => {
  project.stdLib = value
}

let getEnvironment = (project: t): Reducer_T.environment => project.environment
let setEnvironment = (project: t, value: Reducer_T.environment): unit => {
  project.environment = value
}

let getBindings = (project: t, sourceId: string): Reducer_T.namespace => {
  project->getItem(sourceId)->ProjectItem.getContinuation
}

let getBindingsAsRecord = (project: t, sourceId: string): Reducer_T.value => {
  project->getBindings(sourceId)->Reducer_Namespace.toRecord
}

let getContinuationsBefore = (project: t, sourceId: string): array<Reducer_T.namespace> => {
  project->getPastChain(sourceId)->E.A.fmap(project->getBindings)
}

let linkDependencies = (project: t, sourceId: string): Reducer_T.namespace => {
  let pastChain = project->getPastChain(sourceId)
  let namespace = Reducer_Namespace.mergeMany(
    E.A.concatMany([
      [project->getStdLib],
      pastChain->E.A.fmap(project->getBindings),
      pastChain->E.A.fmap(id =>
        Reducer_Namespace.fromArray([
          (
            "__result__",
            switch project->getResult(id) {
            | Ok(result) => result
            | Error(error) => error->SqError.throw
            },
          ),
        ])
      ),
    ]),
  )

  let includesAsVariables = project->getIncludesAsVariables(sourceId)
  E.A.reduce(includesAsVariables, namespace, (acc, (variable, includeFile)) =>
    acc->Reducer_Namespace.set(
      variable,
      project->getBindings(includeFile)->Reducer_Namespace.toRecord,
    )
  )
}

let doLinkAndRun = (project: t, sourceId: string): unit => {
  let context = Reducer_Context.createContext(
    project->linkDependencies(sourceId),
    project->getEnvironment,
  )
  let newItem = project->getItem(sourceId)->ProjectItem.run(context)
  // Js.log("after run " ++ newItem.continuation->Reducer_Bindings.toString)
  project->setItem(sourceId, newItem)
}

type runState = ProjectItem.T.resultArgumentType

let tryRunWithResult = (
  project: t,
  sourceId: string,
  rPrevResult: ProjectItem.T.resultArgumentType,
): ProjectItem.T.resultArgumentType => {
  switch project->getResultOption(sourceId) {
  | Some(result) => result // already ran
  | None =>
    switch rPrevResult {
    | Error(error) => {
        project->setResult(sourceId, Error(error))
        Error(error)
      }

    | Ok(_prevResult) => {
        project->doLinkAndRun(sourceId)
        project->getResultOption(sourceId)->Belt.Option.getWithDefault(rPrevResult)
      }
    }
  }
}

let runAll = (project: t): unit => {
  let runOrder = Topology.getRunOrder(project)
  let initialState = Ok(Reducer_T.IEvVoid)
  let _finalState = E.A.reduce(runOrder, initialState, (currState, currId) =>
    project->tryRunWithResult(currId, currState)
  )
}

let run = (project: t, sourceId: string): unit => {
  let runOrder = Topology.getRunOrderFor(project, sourceId)
  let initialState = Ok(Reducer_T.IEvVoid)
  let _finalState = E.A.reduce(runOrder, initialState, (currState, currId) =>
    project->tryRunWithResult(currId, currState)
  )
}

let evaluate = (sourceCode: string) => {
  let project = createProject()
  project->setSource("main", sourceCode)
  project->runAll

  (
    project->getResultOption("main")->Belt.Option.getWithDefault(Reducer_T.IEvVoid->Ok),
    project->getBindings("main")->Reducer_Namespace.toMap,
  )
}
