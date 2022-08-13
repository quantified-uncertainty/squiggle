module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Bindings = Reducer_Bindings
module T = Reducer_Type_T

let ievFromTypeExpression = (
  typeExpressionSourceCode: string,
  reducerFn: ExpressionT.reducerFn,
): result<InternalExpressionValue.t, ErrorValue.t> => {
  let sIndex = "compiled"
  let sourceCode = `type ${sIndex}=${typeExpressionSourceCode}`
  Reducer_Expression.parse(sourceCode)->Belt.Result.flatMap(expr => {
    let rContext = reducerFn(
      expr,
      Bindings.emptyBindings,
      InternalExpressionValue.defaultEnvironment,
    )
    Belt.Result.map(rContext, context =>
      switch context {
      | IEvBindings(nameSpace) =>
        switch Bindings.getType(nameSpace, sIndex) {
        | Some(value) => value
        | None => raise(Reducer_Exception.ImpossibleException("Reducer_Type_Compile-none"))
        }
      | _ => raise(Reducer_Exception.ImpossibleException("Reducer_Type_Compile-raise"))
      }
    )
  })
}

let fromTypeExpression = (
  typeExpressionSourceCode: string,
  reducerFn: ExpressionT.reducerFn,
): result<T.t, ErrorValue.t> => {
  ievFromTypeExpression(
    (typeExpressionSourceCode: string),
    (reducerFn: ExpressionT.reducerFn),
  )->Belt.Result.map(T.fromIEvValue)
}

let fromTypeExpressionExn = (
  typeExpressionSourceCode: string,
  reducerFn: ExpressionT.reducerFn,
): T.t =>
  switch fromTypeExpression(typeExpressionSourceCode, reducerFn) {
  | Ok(value) => value
  | _ => `Cannot compile ${typeExpressionSourceCode}`->Reducer_Exception.ImpossibleException->raise
  }
