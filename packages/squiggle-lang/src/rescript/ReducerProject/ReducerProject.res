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

@genType.opaque
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
    let this: t = {
      "tag": "reducerProject",
      "items": Belt.Map.String.empty,
      "stdLib": ReducerInterface_StdLib.internalStdLib,
      "environment": InternalExpressionValue.defaultEnvironment,
    }
    this
  }

  let rec touchSource = (this: t, sourceId: string): unit => {
    let item = this->getItem(sourceId)
    let newItem = ProjectItem.touchSource(item)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
    touchDependents(this, sourceId)
  }
  and touchDependents = (this: t, sourceId: string): unit => {
    let _ = getDependents(this, sourceId)->Belt.Array.forEach(_, touchSource(this, _))
  }

  let getSource = (this: t, sourceId: string): option<string> =>
    Belt.Map.String.get(this["items"], sourceId)->Belt.Option.map(ProjectItem.getSource)

  let setSource = (this: t, sourceId: string, value: string): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.setSource(value)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
    touchDependents(this, sourceId)
  }

  let clean = (this: t, sourceId: string): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.clean
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
  }

  let cleanAll = (this: t): unit =>
    getSourceIds(this)->Belt.Array.forEach(sourceId => clean(this, sourceId))

  let cleanResults = (this: t, sourceId: string): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.cleanResults
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
  }

  let cleanAllResults = (this: t): unit =>
    getSourceIds(this)->Belt.Array.forEach(sourceId => cleanResults(this, sourceId))

  let getIncludes = (this: t, sourceId: string): ProjectItem.T.includesType =>
    this->getItem(sourceId)->ProjectItem.getIncludes

  let setContinues = (this: t, sourceId: string, continues: array<string>): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.setContinues(continues)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
    touchSource(this, sourceId)
  }
  let getContinues = (this: t, sourceId: string): array<string> =>
    ProjectItem.getContinues(this->getItem(sourceId))

  let removeContinues = (this: t, sourceId: string): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.removeContinues
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
    touchSource(this, sourceId)
  }

  let getContinuation = (this: t, sourceId: string): ProjectItem.T.continuationArgumentType =>
    this->getItem(sourceId)->ProjectItem.getContinuation

  let setContinuation = (
    this: t,
    sourceId: string,
    continuation: ProjectItem.T.continuationArgumentType,
  ): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.setContinuation(continuation)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
  }

  let getResult = (this: t, sourceId: string): ProjectItem.T.resultType =>
    this->getItem(sourceId)->ProjectItem.getResult

  let setResult = (this: t, sourceId: string, value: ProjectItem.T.resultArgumentType): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.setResult(value)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
  }

  let getExternalResult = (this: t, sourceId: string): ProjectItem.T.externalResultType =>
    this->getItem(sourceId)->ProjectItem.getExternalResult

  let parseIncludes = (this: t, sourceId: string): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.parseIncludes
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
  }

  let rawParse = (this: t, sourceId): unit => {
    let newItem = this->getItem(sourceId)->ProjectItem.rawParse
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
  }

  let getStdLib = (this: t): Reducer_Bindings.t => this["stdLib"]
  let setStdLib = (this: t, value: Reducer_Bindings.t): unit =>
    T.Private.setFieldStdLib(this, value)

  let getEnvironment = (this: t): InternalExpressionValue.environment => this["environment"]
  let setEnvironment = (this: t, value: InternalExpressionValue.environment): unit =>
    T.Private.setFieldEnvironment(this, value)

  let getExternalBindings = (
    this: t,
    sourceId: string,
  ): ProjectItem.T.externalBindingsArgumentType => {
    let those = this->getContinuation(sourceId)
    let these = this->getStdLib
    let ofUser = Continuation.minus(those, these)
    ofUser->InternalExpressionValue.nameSpaceToTypeScriptBindings
  }

  let buildProjectAccessors = (this: t): ProjectAccessorsT.t => {
    states: {continuation: Bindings.emptyBindings},
    stdLib: getStdLib(this),
    environment: getEnvironment(this),
  }

  let doRunWithContinuation = (
    this: t,
    sourceId: string,
    continuation: ProjectItem.T.continuation,
  ): unit => {
    let accessors = buildProjectAccessors(this)
    let states = accessors.states
    let newItem = this->getItem(sourceId)->ProjectItem.run(continuation, accessors)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
    setContinuation(this, sourceId, states.continuation)
  }

  type runState = (ProjectItem.T.resultArgumentType, ProjectItem.T.continuation)

  let tryRunWithContinuation = (
    this: t,
    sourceId: string,
    (rPrevResult: ProjectItem.T.resultArgumentType, continuation: ProjectItem.T.continuation),
  ): (ProjectItem.T.resultArgumentType, ProjectItem.T.continuation) => {
    switch getResult(this, sourceId) {
    | Some(result) => (result, getContinuation(this, sourceId)) // already ran
    | None =>
      switch rPrevResult {
      | Error(error) => {
          setResult(this, sourceId, Error(error))
          (Error(error), continuation)
        }
      | Ok(_prevResult) => {
          doRunWithContinuation(this, sourceId, continuation)
          (
            getResult(this, sourceId)->Belt.Option.getWithDefault(rPrevResult),
            getContinuation(this, sourceId),
          )
        }
      }
    }
  }

  let runAll = (this: t): unit => {
    let runOrder = Topology.getRunOrder(this)
    let initialState = (Ok(InternalExpressionValue.IEvVoid), getStdLib(this))
    let _finalState = Belt.Array.reduce(runOrder, initialState, (currState, currId) =>
      tryRunWithContinuation(this, currId, currState)
    )
  }

  let run = (this: t, sourceId: string): unit => {
    let runOrder = Topology.getRunOrderFor(this, sourceId)
    let initialState = (Ok(InternalExpressionValue.IEvVoid), getStdLib(this))
    let _finalState = Belt.Array.reduce(runOrder, initialState, (currState, currId) =>
      tryRunWithContinuation(this, currId, currState)
    )
  }

  let evaluate = (sourceCode: string) => {
    let project = createProject()
    setSource(project, "main", sourceCode)
    runAll(project)
    (
      getResult(project, "main")->Belt.Option.getWithDefault(IEvVoid->Ok),
      getContinuation(project, "main"),
    )
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
@genType
let createProject = (): t => Private.createProject()->T.Private.castFromInternalProject

/*
Answer all the source ids of all the sources in the project.
*/
@genType
let getSourceIds = (this: reducerProject): array<string> =>
  this->T.Private.castToInternalProject->Private.getSourceIds

/*
Sets the source for a given source Id.
*/
@genType
let setSource = (this: reducerProject, sourceId: string, value: string): unit =>
  this->T.Private.castToInternalProject->Private.setSource(sourceId, value)

/*
Gets the source for a given source id.
*/
@genType
let getSource = (this: reducerProject, sourceId: string): option<string> =>
  this->T.Private.castToInternalProject->Private.getSource(sourceId)

/*
Touches the source for a given source id. This and dependent, sources are set to be re-evaluated.
*/
@genType
let touchSource = (this: reducerProject, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.touchSource(sourceId)

/*
Cleans the compilation artifacts for a given source ID. The results stay untouched, so compilation won't be run again.

Normally, you would never need the compilation artifacts again as the results with the same sources would never change. However, they are needed in case of any debugging reruns
*/
@genType
let clean = (this: reducerProject, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.clean(sourceId)

/*
Cleans all the compilation artifacts in all of the project
*/
@genType
let cleanAll = (this: reducerProject): unit => this->T.Private.castToInternalProject->Private.cleanAll

/*
Cleans results. Compilation stays untouched to be able to re-run the source.
You would not do this if you were not trying to debug the source code.
*/
@genType
let cleanResults = (this: reducerProject, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.cleanResults(sourceId)

/*
Cleans all results. Compilations remains untouched to rerun the source.
*/
@genType
let cleanAllResults = (this: reducerProject): unit =>
  this->T.Private.castToInternalProject->Private.cleanAllResults

/*
To set the includes one first has to call "parseIncludes". The parsed includes or the parser error is returned.
*/
@genType
let getIncludes = (this: reducerProject, sourceId: string): result<
  array<string>,
  Reducer_ErrorValue.errorValue,
> => this->T.Private.castToInternalProject->Private.getIncludes(sourceId)

/*
Answers the source codes after which this source code is continuing
*/
@genType
let getContinues = (this: reducerProject, sourceId: string): array<string> =>
  this->T.Private.castToInternalProject->Private.getContinues(sourceId)

/*
 "continues" acts like hidden includes in the source. 
 It is used to define a continuation that is not visible in the source code. 
 You can chain source codes on the web interface for example
*/
@genType
let setContinues = (this: reducerProject, sourceId: string, continues: array<string>): unit =>
  this->T.Private.castToInternalProject->Private.setContinues(sourceId, continues)

/*
This source depends on the array of sources returned.
*/
@genType
let getDependencies = (this: reducerProject, sourceId: string): array<string> =>
  this->T.Private.castToInternalProject->Private.getDependencies(sourceId)

/*
The sources returned are dependent on this
*/
@genType
let getDependents = (this: reducerProject, sourceId: string): array<string> =>
  this->T.Private.castToInternalProject->Private.getDependents(sourceId)

/*
Get the run order for the sources in the project.
*/
@genType
let getRunOrder = (this: reducerProject): array<string> =>
  this->T.Private.castToInternalProject->Private.getRunOrder

/*
Get the run order to get the results of this specific source
*/
@genType
let getRunOrderFor = (this: reducerProject, sourceId: string) =>
  this->T.Private.castToInternalProject->Private.getRunOrderFor(sourceId)

/*
Parse includes so that you can load them before running. 
Load includes by calling getIncludes which returns the includes that have been parsed. 
It is your responsibility to load the includes before running.
*/
@genType
let parseIncludes = (this: reducerProject, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.parseIncludes(sourceId)

/*
Parse the source code if it is not done already. 
Use getRawParse to get the parse tree. 
You would need this function if you want to see the parse tree without running the source code.
*/
@genType
let rawParse = (this: reducerProject, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.rawParse(sourceId)

/*
Runs a specific source code if it is not done already. The code is parsed if it is not already done. It runs the dependencies if it is not already done.
*/
@genType
let run = (this: reducerProject, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.run(sourceId)

/*
Runs all of the sources in a project. Their results and bindings will be available
*/
@genType
let runAll = (this: reducerProject): unit => this->T.Private.castToInternalProject->Private.runAll

/*
Get the bindings after running this source file or the project
*/
@genType
let getExternalBindings = (this: reducerProject, sourceId: string): ExternalExpressionValue.record =>
  this->T.Private.castToInternalProject->Private.getExternalBindings(sourceId)

/*
Get the result after running this source file or the project
*/
@genType
let getExternalResult = (this: reducerProject, sourceId: string): option<
  result<ExternalExpressionValue.externalExpressionValue, Reducer_ErrorValue.errorValue>,
> => this->T.Private.castToInternalProject->Private.getExternalResult(sourceId)

/*
This is a convenience function to get the result of a single source without creating a project. 
However, without a project, you cannot handle include directives.
The source has to be include free
*/
@genType
let evaluate = (sourceCode: string): ('r, 'b) => {
  let (result, continuation) = Private.evaluate(sourceCode)
  (
    result->Belt.Result.map(InternalExpressionValue.toExternal),
    continuation->InternalExpressionValue.nameSpaceToTypeScriptBindings,
  )
}

@genType
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
