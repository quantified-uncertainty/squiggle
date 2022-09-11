module Bindings = Reducer_Bindings
module ErrorValue = Reducer_ErrorValue

type internalExpressionValue = ReducerInterface_InternalExpressionValue.t

let doLambdaCall = (
  lambdaValue: Reducer_T.lambdaValue,
  args,
  environment: Reducer_T.environment,
  reducer: Reducer_T.reducerFn
): Reducer_T.value => {
  lambdaValue.body(args, environment, reducer)
}

let makeLambda = (
  parameters: array<string>,
  bindings: Reducer_T.nameSpace,
  body: Reducer_T.expression,
): Reducer_T.lambdaValue => {
  // TODO - clone bindings to avoid later redefinitions affecting lambdas?

  // Note: with this implementation, FFI lambdas (created by other methods than calling `makeLambda`) are allowed to violate the rules, pollute the bindings, etc.
  // Not sure yet if that's a bug or a feature.

  let lambda = (
    arguments: array<Reducer_T.value>,
    environment: Reducer_T.environment,
    reducer: Reducer_T.reducerFn
  ) => {
    let argsLength = arguments->Js.Array2.length
    let parametersLength = parameters->Js.Array2.length
    if argsLength !== parametersLength {
      ErrorValue.REArityError(None, parametersLength, argsLength)->ErrorValue.ErrorException->raise
    }

    let localBindings = bindings->Reducer_Bindings.extend
    parameters->Js.Array2.forEachi(
      (parameter, index) => {
        let _ = localBindings->Reducer_Bindings.set(parameter, arguments[index])
      }
    )

    reducer(body, { bindings: localBindings, environment })
  }

  LNoFFI({
    context: bindings,
    body: lambda,
    parameters,
  })
}

let makeFFILambda = () => raise(Not_found)
