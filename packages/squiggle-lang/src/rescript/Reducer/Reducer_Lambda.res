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

    let localBindingsWithParameters = parameters->Belt.Array.reduceWithIndex(localBindings, (
      currentBindings,
      parameter,
      index,
    ) => {
      currentBindings->Reducer_Bindings.set(parameter, arguments[index])
    })

    let lambdaContext: Reducer_T.context = {
      bindings: localBindingsWithParameters, // based on bindings at the moment of lambda creation
      environment: context.environment, // environment at the moment when lambda is called
      callStack: context.callStack, // extended by main `evaluate` function
    }

    let (value, _) = reducer(body, lambdaContext)
    value
  }

  FnLambda({
    // context: bindings,
    name: name,
    body: lambda,
    parameters: parameters,
    location: location,
  })
}

// stdlib lambdas (everything in FunctionRegistry) is built by this method. Body is generated in SquiggleLibrary_StdLib.res
let makeFFILambda = (name: string, body: Reducer_T.lambdaBody): t => FnBuiltin({
  // Note: current bindings could be accidentally exposed here through context (compare with native lambda implementation above, where we override them with local bindings).
  // But FunctionRegistry API is too limited for that to matter. Please take care not to violate that in the future by accident.
  body: body,
  name: name,
})

let extendCallStack = (t: t, callStack: Reducer_CallStack.t): Reducer_CallStack.t => {
  switch t {
  | FnLambda({location}) =>
    callStack->Reducer_CallStack.extend(InLambda({location: location, name: "TODO"})) // FIXME
  | FnBuiltin({name}) => callStack->Reducer_CallStack.extend(InFFI({name: name}))
  }
}

// this function doesn't scale to FunctionRegistry's polymorphic functions
let parameters = (t: t): array<string> => {
  switch t {
  | FnLambda({parameters}) => parameters
  | FnBuiltin(_) => ["..."]
  }
}

let doLambdaCall = (t: t, args, context: Reducer_Context.t, reducer) => {
  let newContext = {
    ...context,
    callStack: t->extendCallStack(context.callStack),
  }

  SqError.contextualizeAndRethrow(() => {
    switch t {
    | FnLambda({body}) => body(args, newContext, reducer)
    | FnBuiltin({body}) => body(args, newContext, reducer)
    }
  }, newContext)
}
