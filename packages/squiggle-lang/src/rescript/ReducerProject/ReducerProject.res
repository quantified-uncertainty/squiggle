// TODO: Auto clean project based on topology

module Bindings = Reducer_Bindings
module Continuation = ReducerInterface_Value_Continuation
module ErrorValue = Reducer_ErrorValue
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectItem = ReducerProject_ProjectItem
module T = ReducerProject_T
module Topology = ReducerProject_Topology

type reducerProject = T.t
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

  let getResult = (project: t, sourceId: string): ProjectItem.T.resultType =>
    project->getItem(sourceId)->ProjectItem.getResult

  let setResult = (project: t, sourceId: string, value: ProjectItem.T.resultArgumentType): unit => {
    let newItem = project->getItem(sourceId)->ProjectItem.setResult(value)
    Belt.Map.String.set(project["items"], sourceId, newItem)->T.Private.setFieldItems(project, _)
  }

  let getExternalResult = (project: t, sourceId: string): ProjectItem.T.externalResultType =>
    project->getItem(sourceId)->ProjectItem.getExternalResult

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

  let getExternalBindings = (
    project: t,
    sourceId: string,
  ): ProjectItem.T.externalBindingsArgumentType => {
    let those = project->getContinuation(sourceId)
    let these = project->getStdLib
    let ofUser = Continuation.minus(those, these)
    ofUser->InternalExpressionValue.nameSpaceToTypeScriptBindings
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
    switch getResult(project, sourceId) {
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
            getResult(project, sourceId)->Belt.Option.getWithDefault(rPrevResult),
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

    (getResult(project, "main")->Belt.Option.getWithDefault(IEvVoid->Ok), ofUser)
  }
}

/*
  PUBLIC FUNCTIONS
*/

/*
Creates a new project to hold the sources, executables, bindings, and other data. 
The new project runs the sources according to their topological sorting because of the includes and continues.

Any source can include or continue other sources. "Therefore, the project is a graph data structure."
The difference between including and continuing is that includes are stated inside the source code while continues are stated in the project.

To run a group of source codes and get results/bindings, the necessary methods are
- setSource
- setContinues
- parseIncludes
- run or runAll
- getExternalBindings
- getExternalResult

A project has a public field tag with a constant value "reducerProject"
project = {tag: "reducerProject"}
*/
let createProject = (): reducerProject => Private.createProject()->T.Private.castFromInternalProject

/*
Answer all the source ids of all the sources in the project.
*/
let getSourceIds = (project: reducerProject): array<string> =>
  project->T.Private.castToInternalProject->Private.getSourceIds

/*
Sets the source for a given source Id.
*/
let setSource = (project: reducerProject, sourceId: string, value: string): unit =>
  project->T.Private.castToInternalProject->Private.setSource(sourceId, value)

/*
Gets the source for a given source id.
*/
let getSource = (project: reducerProject, sourceId: string): option<string> =>
  project->T.Private.castToInternalProject->Private.getSource(sourceId)

/*
Touches the source for a given source id. This and dependent, sources are set to be re-evaluated.
*/
let touchSource = (project: reducerProject, sourceId: string): unit =>
  project->T.Private.castToInternalProject->Private.touchSource(sourceId)

/*
Cleans the compilation artifacts for a given source ID. The results stay untouched, so compilation won't be run again.

Normally, you would never need the compilation artifacts again as the results with the same sources would never change. However, they are needed in case of any debugging reruns
*/
let clean = (project: reducerProject, sourceId: string): unit =>
  project->T.Private.castToInternalProject->Private.clean(sourceId)

/*
Cleans all the compilation artifacts in all of the project
*/
let cleanAll = (project: reducerProject): unit =>
  project->T.Private.castToInternalProject->Private.cleanAll

/*
Cleans results. Compilation stays untouched to be able to re-run the source.
You would not do this if you were not trying to debug the source code.
*/
let cleanResults = (project: reducerProject, sourceId: string): unit =>
  project->T.Private.castToInternalProject->Private.cleanResults(sourceId)

/*
Cleans all results. Compilations remains untouched to rerun the source.
*/
let cleanAllResults = (project: reducerProject): unit =>
  project->T.Private.castToInternalProject->Private.cleanAllResults

/*
To set the includes one first has to call "parseIncludes". The parsed includes or the parser error is returned.
*/
let getIncludes = (project: reducerProject, sourceId: string): result<
  array<string>,
  Reducer_ErrorValue.errorValue,
> => project->T.Private.castToInternalProject->Private.getIncludes(sourceId)

/*
Answers the source codes after which this source code is continuing
*/
let getContinues = (project: reducerProject, sourceId: string): array<string> =>
  project->T.Private.castToInternalProject->Private.getContinues(sourceId)

/*
 "continues" acts like hidden includes in the source. 
 It is used to define a continuation that is not visible in the source code. 
 You can chain source codes on the web interface for example
*/
let setContinues = (project: reducerProject, sourceId: string, continues: array<string>): unit =>
  project->T.Private.castToInternalProject->Private.setContinues(sourceId, continues)

/*
This source depends on the array of sources returned.
*/
let getDependencies = (project: reducerProject, sourceId: string): array<string> =>
  project->T.Private.castToInternalProject->Private.getDependencies(sourceId)

/*
The sources returned are dependent on this
*/
let getDependents = (project: reducerProject, sourceId: string): array<string> =>
  project->T.Private.castToInternalProject->Private.getDependents(sourceId)

/*
Get the run order for the sources in the project.
*/
let getRunOrder = (project: reducerProject): array<string> =>
  project->T.Private.castToInternalProject->Private.getRunOrder

/*
Get the run order to get the results of this specific source
*/
let getRunOrderFor = (project: reducerProject, sourceId: string) =>
  project->T.Private.castToInternalProject->Private.getRunOrderFor(sourceId)

/*
Parse includes so that you can load them before running. 
Load includes by calling getIncludes which returns the includes that have been parsed. 
It is your responsibility to load the includes before running.
*/
let parseIncludes = (project: reducerProject, sourceId: string): unit =>
  project->T.Private.castToInternalProject->Private.parseIncludes(sourceId)

/*
Parse the source code if it is not done already. 
Use getRawParse to get the parse tree. 
You would need this function if you want to see the parse tree without running the source code.
*/
let rawParse = (project: reducerProject, sourceId: string): unit =>
  project->T.Private.castToInternalProject->Private.rawParse(sourceId)

/*
Runs a specific source code if it is not done already. The code is parsed if it is not already done. It runs the dependencies if it is not already done.
*/
let run = (project: reducerProject, sourceId: string): unit =>
  project->T.Private.castToInternalProject->Private.run(sourceId)

/*
Runs all of the sources in a project. Their results and bindings will be available
*/
let runAll = (project: reducerProject): unit =>
  project->T.Private.castToInternalProject->Private.runAll

/*
Get the bindings after running this source file or the project
*/
let getExternalBindings = (
  project: reducerProject,
  sourceId: string,
): ExternalExpressionValue.record =>
  project->T.Private.castToInternalProject->Private.getExternalBindings(sourceId)

/*
Get the result after running this source file or the project
*/
let getExternalResult = (project: reducerProject, sourceId: string): option<
  result<ExternalExpressionValue.externalExpressionValue, Reducer_ErrorValue.errorValue>,
> => project->T.Private.castToInternalProject->Private.getExternalResult(sourceId)

/*
This is a convenience function to get the result of a single source without creating a project. 
However, without a project, you cannot handle include directives.
The source has to be include free
*/
let evaluate = (sourceCode: string): ('r, 'b) => {
  let (result, continuation) = Private.evaluate(sourceCode)
  (
    result->Belt.Result.map(InternalExpressionValue.toExternal),
    continuation->InternalExpressionValue.nameSpaceToTypeScriptBindings,
  )
}

let setEnvironment = (
  project: reducerProject,
  environment: ExternalExpressionValue.environment,
): unit => project->T.Private.castToInternalProject->Private.setEnvironment(environment)

let foreignFunctionInterface = (
  lambdaValue: ExternalExpressionValue.lambdaValue,
  argArray: array<ExternalExpressionValue.externalExpressionValue>,
  environment: ExternalExpressionValue.environment,
) => {
  let internallambdaValue = InternalExpressionValue.lambdaValueToInternal(lambdaValue)
  let internalArgArray = argArray->Js.Array2.map(InternalExpressionValue.toInternal)
  let accessors = ProjectAccessorsT.identityAccessorsWithEnvironment(environment)
  Reducer_Expression_Lambda.foreignFunctionInterface(
    internallambdaValue,
    internalArgArray,
    accessors,
    Reducer_Expression.reduceExpressionInProject,
  )->Belt.Result.map(InternalExpressionValue.toExternal)
}
