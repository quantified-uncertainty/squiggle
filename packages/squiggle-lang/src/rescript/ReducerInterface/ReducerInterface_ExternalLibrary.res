module InternalExpressionValue = ReducerInterface_InternalExpressionValue

type internalExpressionValue = InternalExpressionValue.t

// module Sample = {
//   // In real life real libraries should be somewhere else
//   /*
//     For an example of mapping polymorphic custom functions. To be deleted after real integration
//  */
//   let customAdd = (a: float, b: float): float => {a +. b}
// }

/*
  Map external calls of Reducer
*/

// I expect that it's important to build this first, so it doesn't get recalculated for each tryRegistry() call.
let registry = FunctionRegistry_Library.registry

let tryRegistry = ((fnName, args): InternalExpressionValue.functionCall, env) => {
  FunctionRegistry_Core.Registry.matchAndRun(~registry, ~fnName, ~args, ~env)->E.O2.fmap(
    E.R2.errMap(_, s => Reducer_ErrorValue.RETodo(s)),
  )
}

let dispatch = (call: InternalExpressionValue.functionCall, environment, reducer, chain): result<
  internalExpressionValue,
  'e,
> => {
  E.A.O.firstSomeFn([
    () => ReducerInterface_GenericDistribution.dispatch(call, environment),
    () => ReducerInterface_Date.dispatch(call, environment),
    () => ReducerInterface_Duration.dispatch(call, environment),
    () => ReducerInterface_Number.dispatch(call, environment),
    () => tryRegistry(call, environment),
  ])->E.O2.default(chain(call, environment, reducer))
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
