module InternalExpressionValue = ReducerInterface_InternalExpressionValue
type internalExpressionValue = InternalExpressionValue.t

/*
  Map external calls of Reducer
*/
let dispatch = (call: InternalExpressionValue.functionCall, environment, chain): result<
  internalExpressionValue,
  'e,
> => {
  E.A.O.firstSomeFn([
    () => ReducerInterface_GenericDistribution.dispatch(call, environment),
    () => ReducerInterface_Date.dispatch(call, environment),
    () => ReducerInterface_Duration.dispatch(call, environment),
    () => ReducerInterface_Number.dispatch(call, environment),
    () => FunctionRegistry_Library.dispatch(call, environment),
  ])->E.O2.default(chain(call, environment))
}
