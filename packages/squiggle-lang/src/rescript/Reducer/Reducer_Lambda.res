type t = Reducer_T.lambdaValue

// user-defined functions, i.e. `add2 = {|x, y| x + y}`, are built by this method
let makeLambda = (
  name: option<string>,
  parameters: array<string>,
  bindings: Reducer_T.bindings,
  body: Reducer_T.expression,
  location: Reducer_Peggy_Parse.location,
): t => {
  let lambda = (
    arguments: array<Reducer_T.value>,
    context: Reducer_T.context,
    reducer: Reducer_T.reducerFn,
  ) => {
    let argsLength = arguments->E.A.length
    let parametersLength = parameters->E.A.length
    if argsLength !== parametersLength {
      SqError.Message.REArityError(None, parametersLength, argsLength)->SqError.Message.throw
    }

    // create new bindings scope - technically not necessary, since bindings are immutable, but might help with debugging/new features in the future
    let localBindings = bindings->Reducer_Bindings.extend

    let localBindingsWithParameters = parameters->E.A.reducei(localBindings, (
      currentBindings,
      parameter,
      index,
    ) => {
      currentBindings->Reducer_Bindings.set(parameter, arguments[index])
    })

    let lambdaContext: Reducer_T.context = {
      bindings: localBindingsWithParameters, // based on bindings at the moment of lambda creation
      environment: context.environment, // environment at the moment when lambda is called
      frameStack: context.frameStack, // already extended in `doLambdaCall`
      inFunction: context.inFunction, // already updated in `doLambdaCall`
    }

    let (value, _) = reducer(body, lambdaContext)
    value
  }

  FnLambda({
    // context: bindings,
    name,
    body: lambda,
    parameters,
    location,
  })
}

// stdlib functions (everything in FunctionRegistry) are built by this method. Body is generated in SquiggleLibrary_StdLib.res
let makeFFILambda = (name: string, body: Reducer_T.lambdaBody): t => FnBuiltin({
  // Note: current bindings could be accidentally exposed here through context (compare with native lambda implementation above, where we override them with local bindings).
  // But FunctionRegistry API is too limited for that to matter. Please take care not to violate that in the future by accident.
  body,
  name,
})

// this function doesn't scale to FunctionRegistry's polymorphic functions
let parameters = (t: t): array<string> => {
  switch t {
  | FnLambda({parameters}) => parameters
  | FnBuiltin(_) => ["..."]
  }
}

let doLambdaCallFrom = (
  t: t,
  args: array<Reducer_T.value>,
  context: Reducer_T.context,
  reducer,
  location: option<Reducer_Peggy_Parse.location>,
) => {
  let newContext = {
    ...context,
    frameStack: context.frameStack->Reducer_FrameStack.extend(
      context->Reducer_Context.currentFunctionName,
      location,
    ),
    inFunction: Some(t),
  }

  SqError.rethrowWithFrameStack(() => {
    switch t {
    | FnLambda({body}) => body(args, newContext, reducer)
    | FnBuiltin({body}) => body(args, newContext, reducer)
    }
  }, newContext.frameStack)
}

let doLambdaCall = (t: t, args, context, reducer) => {
  doLambdaCallFrom(t, args, context, reducer, None)
}
