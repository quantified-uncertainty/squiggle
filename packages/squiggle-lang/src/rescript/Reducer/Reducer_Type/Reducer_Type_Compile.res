module Bindings = Reducer_Bindings
module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectReducerFnT = ReducerProject_ReducerFn_T
module T = Reducer_Type_T

let ievFromTypeExpression = (
  typeExpressionSourceCode: string,
  reducerFn: ProjectReducerFnT.t,
): result<InternalExpressionValue.t, ErrorValue.t> => {
  let sIndex = "compiled"
  let sourceCode = `type ${sIndex}=${typeExpressionSourceCode}`
  Reducer_Expression.BackCompatible.parse(sourceCode)->Belt.Result.flatMap(expr => {
    let accessors = ProjectAccessorsT.identityAccessors
    let result = reducerFn(expr, Bindings.emptyBindings, accessors)
    let nameSpace = accessors.continuation

    switch result {
    | Ok(_) =>
      switch Bindings.getType(nameSpace, sIndex) {
      | Some(value) => value->Ok
      | None => raise(Reducer_Exception.ImpossibleException("Reducer_Type_Compile-none"))
      }
    | err => err
    }
  })
}

let fromTypeExpression = (typeExpressionSourceCode: string, reducerFn: ProjectReducerFnT.t): result<
  T.t,
  ErrorValue.t,
> => {
  ievFromTypeExpression(typeExpressionSourceCode, reducerFn)->Belt.Result.map(T.fromIEvValue)
}
