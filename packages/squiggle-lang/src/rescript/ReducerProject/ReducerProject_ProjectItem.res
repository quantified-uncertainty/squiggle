// TODO: Use actual types instead of aliases in public functions
// TODO: Use topological sorting to prevent unnecessary runs
module Bindings = Reducer_Bindings
module Continuation = ReducerInterface_Value_Continuation
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ReducerFnT = ReducerProject_ReducerFn_T
module T = ReducerProject_ProjectItem_T

type projectItem = T.projectItem
type t = T.t

let emptyItem = T.ProjectItem({
  source: "",
  rawParse: None,
  expression: None,
  continuation: Bindings.emptyBindings,
  result: None,
  continues: [],
  includes: []->Ok,
})
// source -> rawParse -> includes -> expression -> continuation -> result

let getSource = (T.ProjectItem(r)): T.sourceType => r.source
let getRawParse = (T.ProjectItem(r)): T.rawParseType => r.rawParse
let getExpression = (T.ProjectItem(r)): T.expressionType => r.expression
let getContinuation = (T.ProjectItem(r)): T.continuationArgumentType => r.continuation
let getResult = (T.ProjectItem(r)): T.resultType => r.result

let getContinues = (T.ProjectItem(r)): T.continuesType => r.continues
let getIncludes = (T.ProjectItem(r)): T.includesType => r.includes

let touchSource = (this: t): t => {
  let T.ProjectItem(r) = emptyItem
  T.ProjectItem({
    ...r,
    includes: getIncludes(this),
    continues: getContinues(this),
    source: getSource(this),
  })
}
let touchRawParse = (this: t): t => {
  let T.ProjectItem(r) = emptyItem
  T.ProjectItem({
    ...r,
    continues: getContinues(this),
    source: getSource(this),
    rawParse: getRawParse(this),
    includes: getIncludes(this),
  })
}
let touchExpression = (this: t): t => {
  let T.ProjectItem(r) = emptyItem
  T.ProjectItem({
    ...r,
    continues: getContinues(this),
    source: getSource(this),
    rawParse: getRawParse(this),
    includes: getIncludes(this),
    expression: getExpression(this),
  })
}

let setSource = (T.ProjectItem(r): t, source: T.sourceArgumentType): t =>
  T.ProjectItem({...r, source: source})->touchSource

let setRawParse = (T.ProjectItem(r): t, rawParse: T.rawParseArgumentType): t =>
  T.ProjectItem({...r, rawParse: Some(rawParse)})->touchRawParse

let setExpression = (T.ProjectItem(r): t, expression: T.expressionArgumentType): t =>
  T.ProjectItem({...r, expression: Some(expression)})->touchExpression

let setContinuation = (T.ProjectItem(r): t, continuation: T.continuationArgumentType): t => {
  T.ProjectItem({...r, continuation: continuation})
}

let setResult = (T.ProjectItem(r): t, result: T.resultArgumentType): t => T.ProjectItem({
  ...r,
  result: Some(result),
})

let cleanResults = touchExpression

let clean = (this: t): t => {
  let T.ProjectItem(r) = emptyItem
  T.ProjectItem({
    ...r,
    source: getSource(this),
    continuation: getContinuation(this),
    result: getResult(this),
  })
}

let getImmediateDependencies = (this: t): T.includesType =>
  getIncludes(this)->Belt.Result.map(Js.Array2.concat(_, getContinues(this)))

let setContinues = (T.ProjectItem(r): t, continues: array<string>): t =>
  T.ProjectItem({...r, continues: continues})->touchSource
let removeContinues = (T.ProjectItem(r): t): t => T.ProjectItem({...r, continues: []})->touchSource

let setIncludes = (T.ProjectItem(r): t, includes: T.includesType): t => T.ProjectItem({
  ...r,
  includes: includes,
})

//TODO: forward parse errors to the user
let parseIncludes = (this: t): t =>
  setIncludes(this, getSource(this)->ReducerProject_ParseIncludes.parseIncludes->Ok)

let doRawParse = (this: t): T.rawParseArgumentType => this->getSource->Reducer_Peggy_Parse.parse

let rawParse = (this: t): t =>
  this->getRawParse->E.O2.defaultFn(() => doRawParse(this))->setRawParse(this, _)

let doBuildExpression = (this: t): T.expressionType =>
  this
  ->getRawParse
  ->Belt.Option.map(o => o->Belt.Result.map(r => r->Reducer_Peggy_ToExpression.fromNode))

let buildExpression = (this: t): t => {
  let withRawParse: t = this->rawParse
  switch withRawParse->getExpression {
  | Some(_) => withRawParse
  | None =>
    withRawParse
    ->doBuildExpression
    ->Belt.Option.map(setExpression(withRawParse, _))
    ->E.O2.defaultFn(() => withRawParse)
  }
}

let wrappedReducer = (
  rExpression: T.expressionArgumentType,
  aContinuation: T.continuation,
  accessors: ProjectAccessorsT.t,
): T.resultArgumentType => {
  Belt.Result.flatMap(
    rExpression,
    Reducer_Expression.reduceExpressionInProject(_, aContinuation, accessors),
  )
}

let doBuildResult = (
  this: t,
  aContinuation: T.continuation,
  accessors: ProjectAccessorsT.t,
): T.resultType =>
  this
  ->getExpression
  ->Belt.Option.map(
    Belt.Result.flatMap(
      _,
      Reducer_Expression.reduceExpressionInProject(_, aContinuation, accessors),
    ),
  )

let buildResult = (this: t, aContinuation: T.continuation, accessors: ProjectAccessorsT.t): t => {
  let withExpression: t = this->buildExpression
  switch withExpression->getResult {
  | Some(_) => withExpression
  | None =>
    withExpression
    ->doBuildResult(aContinuation, accessors)
    ->Belt.Option.map(setResult(withExpression, _))
    ->E.O2.defaultFn(() => withExpression)
  }
}

let run = buildResult
