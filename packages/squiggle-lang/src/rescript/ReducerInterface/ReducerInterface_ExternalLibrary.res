module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ProjectAccessorsT = ReducerProject_ProjectAccessors_T
module ProjectReducerFnT = ReducerProject_ReducerFn_T
type internalExpressionValue = InternalExpressionValue.t

/*
  Map external calls of Reducer
*/
let dispatch = (
  call: InternalExpressionValue.functionCall,
  accessors: ProjectAccessorsT.t,
  reducer: ProjectReducerFnT.t,
  chain,
): result<internalExpressionValue, 'e> => {
  E.A.O.firstSomeFn([
    () => ReducerInterface_GenericDistribution.dispatch(call, accessors.environment),
    () => ReducerInterface_Date.dispatch(call, accessors.environment),
    () => ReducerInterface_Duration.dispatch(call, accessors.environment),
    () => ReducerInterface_Number.dispatch(call, accessors.environment),
    () => FunctionRegistry_Library.dispatch(call, accessors, reducer),
  ])->E.O2.defaultFn(() => chain(call, accessors, reducer))
}

/*
If your dispatch is too big you can divide it into smaller dispatches and pass the call so that it gets called finally.

The final chain(call) invokes the builtin default functions of the interpreter.

Via chain(call), all MathJs operators and functions are available for string, number , boolean, array and record
 .e.g + - / * > >= < <= == /= not and or sin cos log ln concat, etc.

// See https://mathjs.org/docs/expressions/syntax.html
// See https://mathjs.org/docs/reference/functions.html

Remember from the users point of view, there are no different modules:
// "doSth( constructorType1 )"
// "doSth( constructorType2 )"
doSth gets dispatched to the correct module because of the type signature. You get function and operator abstraction for free. You don't need to combine different implementations into one type. That would be duplicating the repsonsibility of the dispatcher.
*/
