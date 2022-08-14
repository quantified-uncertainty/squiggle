// TODO: Restore run FFI?
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
type project = T.t
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
    continuation: Bindings.emptyBindings,
    stdLib: getStdLib(this),
    environment: getEnvironment(this),
  }

  let doRunWithContinuation = (
    this: t,
    sourceId: string,
    continuation: ProjectItem.T.continuation,
  ): unit => {
    let accessors = buildProjectAccessors(this)
    let newItem = this->getItem(sourceId)->ProjectItem.run(continuation, accessors)
    Belt.Map.String.set(this["items"], sourceId, newItem)->T.Private.setFieldItems(this, _)
    setContinuation(this, sourceId, accessors.continuation)
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

// Create a new this to hold the sources, executables, bindings and other data.
// The this is a mutable object for use in TypeScript.
let createProject = (): t => Private.createProject()->T.Private.castFromInternalProject

// Answers the array of existing source ids to enumerate over.
let getSourceIds = (this: t): array<string> =>
  this->T.Private.castToInternalProject->Private.getSourceIds

// Sets the source for a given source id.
let setSource = (this: t, sourceId: string, value: string): unit =>
  this->T.Private.castToInternalProject->Private.setSource(sourceId, value)

// Gets the source for a given source id.
let getSource = (this: t, sourceId: string): option<string> =>
  this->T.Private.castToInternalProject->Private.getSource(sourceId)

// Touches the source for a given source id. This forces the dependency graph to be re-evaluated.
// Touching source code clears the includes so that they can be reevaluated.
let touchSource = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.touchSource(sourceId)

// Cleans the compilation artifacts for a given source id. The results stay untouched.
let clean = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.clean(sourceId)

// Cleans all compilation artifacts for all the this. The results stay untouched.
let cleanAll = (this: t): unit => this->T.Private.castToInternalProject->Private.cleanAll

// Cleans results. Compilation stays untouched to rerun the source.
let cleanResults = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.cleanResults(sourceId)

// Cleans all results. Compilations stays untouched to rerun the source.
let cleanAllResults = (this: t): unit =>
  this->T.Private.castToInternalProject->Private.cleanAllResults

let getIncludes = (this: t, sourceId: string): ProjectItem.T.includesType =>
  this->T.Private.castToInternalProject->Private.getIncludes(sourceId)

let getContinues = (this: t, sourceId: string): array<string> =>
  this->T.Private.castToInternalProject->Private.getContinues(sourceId)

// setContinues acts like an include hidden in the source. It is used to define a continuation.
let setContinues = (this: t, sourceId: string, continues: array<string>): unit =>
  this->T.Private.castToInternalProject->Private.setContinues(sourceId, continues)

// This source is not continuing any other source. It is a standalone source.
// Touches this source also.
let removeContinues = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.removeContinues(sourceId)

// Gets includes and continues for a given source id. SourceId is depending on them
let getDependencies = (this: t, sourceId: string): array<string> =>
  this->T.Private.castToInternalProject->Private.getDependencies(sourceId)

// Get source ids depending on a given source id.
let getDependents = (this: t, sourceId: string): array<string> =>
  this->T.Private.castToInternalProject->Private.getDependents(sourceId)

// Get run order for all sources. It is a topological sort of the dependency graph.
let getRunOrder = (this: t) => this->T.Private.castToInternalProject->Private.getRunOrder

// Get run order for a given source id. It is a topological sort of the dependency graph.
let getRunOrderFor = (this: t, sourceId: string) =>
  this->T.Private.castToInternalProject->Private.getRunOrderFor(sourceId)

// Parse includes so that you can load them before running. Use getIncludes to get the includes.
// It is your responsibility to load the includes before running.
let parseIncludes = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.parseIncludes(sourceId)

// Parse the source code if it is not done already. Use getRawParse to get the parse tree
let rawParse = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.rawParse(sourceId)

// Runs the source code.
// The code is parsed if it is not already done.
// If it continues/includes another source then it will run that source also if is not already done.
let run = (this: t, sourceId: string): unit =>
  this->T.Private.castToInternalProject->Private.run(sourceId)

// Runs all the sources.
let runAll = (this: t): unit => this->T.Private.castToInternalProject->Private.runAll

// WARNING" getExternalBindings will be deprecated. Cyclic directed graph problems
// Get the bindings after running the source code.
let getExternalBindings = (this: t, sourceId: string): ExternalExpressionValue.record =>
  this->T.Private.castToInternalProject->Private.getExternalBindings(sourceId)

//WARNING: externalResult will be deprecated. Cyclic directed graph problems
let getExternalResult = (this: t, sourceId: string): option<
  result<ExternalExpressionValue.t, Reducer_ErrorValue.errorValue>,
> => this->T.Private.castToInternalProject->Private.getExternalResult(sourceId)

// This is a convenience function to get the result of a single source.
// You cannot use includes
let evaluate = (sourceCode: string): ('r, 'b) => {
  let (result, continuation) = Private.evaluate(sourceCode)
  (
    result->Belt.Result.map(InternalExpressionValue.toExternal),
    continuation->InternalExpressionValue.nameSpaceToTypeScriptBindings,
  )
}

let foreignFunctionInterface = (
  lambdaValue: ExternalExpressionValue.lambdaValue,
  argArray: array<ExternalExpressionValue.t>,
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
