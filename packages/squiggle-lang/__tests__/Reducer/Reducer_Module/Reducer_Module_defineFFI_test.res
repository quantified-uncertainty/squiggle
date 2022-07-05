module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionT = Reducer_Expression_T
module Module = Reducer_Module
module Bindings = Reducer_Module
module ErrorValue = Reducer_ErrorValue

open Jest
open Expect

// ----------------------
// --- Start of Module File
// ----------------------

module FooImplementation = {
  // As this is a Rescript module, functions can use other functions in this module 
  // and in other stdLib modules implemented this way. 
  // Embedding function definitions in to switch statements is a bad practice 
  // - to reduce line count or to   
  let fooNumber = 0.0
  let fooString = "Foo String"
  let fooBool = true
  let makeFoo = (a: string, b: string, _environment): string => `I am ${a}-foo and I am ${b}-foo`
  let makeBar = (a: float, b: float, _environment): string =>
    `I am ${a->Js.Float.toString}-bar and I am ${b->Js.Float.toString}-bar`
}

module FooFFI = {
  let makeFoo: ExpressionT.optionFfiFn = (args: array<InternalExpressionValue.t>, environment) => {
    switch args {
    | [IEvString(a), IEvString(b)] => FooImplementation.makeFoo(a, b, environment)->IEvString->Some
    | _ => None
    }
  }
  let makeBar: ExpressionT.optionFfiFn = (args: array<InternalExpressionValue.t>, environment) =>
    switch args {
    | [IEvNumber(a), IEvNumber(b)] => FooImplementation.makeBar(a, b, environment)->IEvString->Some
    | _ => None
    }
}

let fooModule: Module.t =
  Module.emptyStdLib
  ->Module.defineNumber("fooNumber", FooImplementation.fooNumber)
  ->Module.defineString("fooString", FooImplementation.fooString)
  ->Module.defineBool("fooBool", FooImplementation.fooBool)
  ->Module.defineFunction("makeFoo", FooFFI.makeFoo)
  ->Module.defineFunction("makeBar", FooFFI.makeBar)

let makeBindings = (prevBindings: Bindings.t): Bindings.t =>
  prevBindings->Module.defineModule("Foo", fooModule)

// ----------------------
// --- End of Module File
// ----------------------

let stdLibWithFoo = Bindings.emptyBindings->makeBindings
let evalWithFoo = sourceCode =>
  Reducer_Expression.parse(sourceCode)->Belt.Result.flatMap(expr =>
    Reducer_Expression.reduceExpression(
      expr,
      stdLibWithFoo,
      InternalExpressionValue.defaultEnvironment,
    )
  )
let evalToStringResultWithFoo = sourceCode =>
  evalWithFoo(sourceCode)->InternalExpressionValue.toStringResult

describe("Module", () => {
  test("fooNumber", () => {
    let result = evalToStringResultWithFoo("Foo.fooNumber")
    expect(result)->toEqual("Ok(0)")
  })
  test("fooString", () => {
    let result = evalToStringResultWithFoo("Foo.fooString")
    expect(result)->toEqual("Ok('Foo String')")
  })
  test("fooBool", () => {
    let result = evalToStringResultWithFoo("Foo.fooBool")
    expect(result)->toEqual("Ok(true)")
  })
  test("fooBool", () => {
    let result = evalToStringResultWithFoo("Foo.fooBool")
    expect(result)->toEqual("Ok(true)")
  })
  test("makeFoo", () => {
    let result = evalToStringResultWithFoo("Foo.makeFoo('a', 'b')")
    expect(result)->toEqual("Ok('I am a-foo and I am b-foo')")
  })
  test("makeFoo wrong arguments", () => {
    let result = evalToStringResultWithFoo("Foo.makeFoo(1, 2)")
    // Notice the error with types
    expect(result)->toEqual("Error(Function not found: makeFoo(Number,Number))")
  })
  test("makeBar", () => {
    let result = evalToStringResultWithFoo("Foo.makeBar(1, 2)")
    expect(result)->toEqual("Ok('I am 1-bar and I am 2-bar')")
  })
})
