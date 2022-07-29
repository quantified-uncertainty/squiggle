open Jest
open Expect

module DispatchT = Reducer_Dispatch_T
module Expression = Reducer_Expression
module ExpressionT = Reducer_Expression_T
module TypeCompile = Reducer_Type_Compile
module TypeChecker = Reducer_Type_TypeChecker
open ReducerInterface_InternalExpressionValue

type errorValue = Reducer_ErrorValue.errorValue

// Let's build a function to replace switch statements
// In dispatchChainPiece, we execute an return the result of execution if there is a type match.
// Otherwise we return None so that the call chain can continue.
// So we want to build a function like
// dispatchChainPiece = (call: functionCall, environment): option<result<internalExpressionValue, errorValue>>

// Now lets make the dispatchChainPiece itself.
// Note that I am not passing the reducer to the dispatchChainPiece as an argument because it is in the context anyway.
// Keep in mind that reducerFn is necessary for map/reduce so dispatchChainPiece should have a reducerFn in context.

let makeMyDispatchChainPiece = (reducer: ExpressionT.reducerFn): DispatchT.dispatchChainPiece => {
  // Let's have a pure implementations
  module Implementation = {
    let stringConcat = (a: string, b: string): string => Js.String2.concat(a, b)
    let arrayConcat = (
      a: Js.Array2.t<internalExpressionValue>,
      b: Js.Array2.t<internalExpressionValue>,
    ): Js.Array2.t<internalExpressionValue> => Js.Array2.concat(a, b)
    let plot = _r => "yey, plotted"
  }

  let extractStringString = args =>
    switch args {
    | [IEvString(a), IEvString(b)] => (a, b)
    | _ => raise(Reducer_Exception.ImpossibleException("extractStringString developer error"))
    }

  let extractArrayArray = args =>
    switch args {
    | [IEvArray(a), IEvArray(b)] => (a, b)
    | _ => raise(Reducer_Exception.ImpossibleException("extractArrayArray developer error"))
    }

  // Let's bridge the pure implementation to expression values
  module Bridge = {
    let stringConcat: DispatchT.genericIEvFunction = (args, _environment) => {
      let (a, b) = extractStringString(args)
      Implementation.stringConcat(a, b)->IEvString->Ok
    }
    let arrayConcat: DispatchT.genericIEvFunction = (args, _environment) => {
      let (a, b) = extractArrayArray(args)
      Implementation.arrayConcat(a, b)->IEvArray->Ok
    }
    let plot: DispatchT.genericIEvFunction = (args, _environment) => {
      switch args {
      // Just assume that we are doing the business of extracting and converting the deep record
      | [IEvRecord(_)] => Implementation.plot({"title": "This is a plot"})->IEvString->Ok
      | _ => raise(Reducer_Exception.ImpossibleException("plot developer error"))
      }
    }
  }

  // concat functions are to illustrate polymoprhism. And the plot function is to illustrate complex types
  let jumpTable = [
    (
      "concat",
      TypeCompile.fromTypeExpressionExn("string=>string=>string", reducer),
      Bridge.stringConcat,
    ),
    (
      "concat",
      TypeCompile.fromTypeExpressionExn("[any]=>[any]=>[any]", reducer),
      Bridge.arrayConcat,
    ),
    (
      "plot",
      TypeCompile.fromTypeExpressionExn(
        // Nested complex types are available
        // records {property: type}
        // arrays [type]
        // tuples [type, type]
        // <- type contracts are available naturally and they become part of dispatching
        // Here we are not enumerating the possibilities because type checking has a dedicated test
        "{title: string, line: {width: number, color: string}}=>string",
        reducer,
      ),
      Bridge.plot,
    ),
  ]

  //Here we are creating a dispatchChainPiece function that will do the actual dispatch from the jumpTable
  Reducer_Dispatch_ChainPiece.makeFromTypes(jumpTable)
}

// And finally, let's write a library dispatch for our external library
// Exactly the same as the one used in real life
let _dispatch = (
  call: functionCall,
  environment,
  reducer: Reducer_Expression_T.reducerFn,
  chain,
): result<internalExpressionValue, 'e> => {
  let dispatchChainPiece = makeMyDispatchChainPiece(reducer)
  dispatchChainPiece(call, environment)->E.O2.defaultFn(() => chain(call, environment, reducer))
}

// What is important about this implementation?
// A) Exactly the same function jump table can be used to create type guarded lambda functions
// Guarded lambda functions will be the basis of the next version of Squiggle
// B) Complicated recursive record types are not a problem.

describe("Type Dispatch", () => {
  let reducerFn = Expression.reduceExpression
  let dispatchChainPiece = makeMyDispatchChainPiece(reducerFn)
  test("stringConcat", () => {
    let call: functionCall = ("concat", [IEvString("hello"), IEvString("world")])

    let result = dispatchChainPiece(call, defaultEnvironment)
    expect(result)->toEqual(Some(Ok(IEvString("helloworld"))))
  })
})
