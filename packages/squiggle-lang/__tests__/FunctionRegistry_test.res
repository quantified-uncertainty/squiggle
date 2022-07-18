module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionT = Reducer_Expression_T
// module Module = Reducer_Module
// module Bindings = Reducer_Module
module ErrorValue = Reducer_ErrorValue

open Jest
open Expect

// ----------------------
// --- Start of Module File
// ----------------------

module FooImplementation = {
  open FunctionRegistry_Core
  open FunctionRegistry_Helpers

  let fn1 = Function.make(
    ~name="add",
    ~nameSpace="Foo",
    ~requiresNamespace=false,
    ~examples=["Foo.add2(1, 2)", "Foo.add3(1, 2, 3)"],
    ~output=EvtNumber,
    ~definitions=[
      FnDefinition.make(
        ~name="add2",
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _) =>
          switch inputs {
          | [FRValueNumber(a), FRValueNumber(b)] => Ok(Wrappers.evNumber(a +. b))
          | _ => Error("False")
          },
        (),
      ),
      FnDefinition.make(
        ~name="add3",
        ~inputs=[FRTypeNumber, FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _) =>
          switch inputs {
          | [FRValueNumber(a), FRValueNumber(b), FRValueNumber(c)] =>
            Ok(Wrappers.evNumber(a +. b +. c))
          | _ => Error("False")
          },
        (),
      ),
    ],
    (),
  )

  let library = [fn1]
}
      
// let makeBindings = FunctionRegistry_Core.Registry.makeBindings(_, FooImplementation.library)

// let stdLibWithFoo = Bindings.emptyBindings->makeBindings

// let evalWithFoo = sourceCode =>
//   Reducer_Expression.parse(sourceCode)->Belt.Result.flatMap(expr =>
//     Reducer_Expression.reduceExpression(
//       expr,
//       stdLibWithFoo,
//       InternalExpressionValue.defaultEnvironment,
//     )
//   )

// let evalToStringResultWithFoo = sourceCode =>
//   evalWithFoo(sourceCode)->InternalExpressionValue.toStringResult

// describe("Module", () => {
//   test("add2(1,2)", () => {
//     let result = evalToStringResultWithFoo("Foo.add2(1,2)")
//     expect(result)->toEqual("Ok(3)")
//   })
//   test("add3(1,2,3)", () => {
//     let result = evalToStringResultWithFoo("Foo.add3(1,2,3)")
//     expect(result)->toEqual("Ok(6)")
//   })
// })

// describe("Fn auto-testing", () => {
//   let items = FooImplementation.fn1.examples->E.A.to_list

//   testAll("tests of validity", items, r => {
//     expect(r->evalWithFoo->E.R.isOk)->toEqual(true)
//   })

//   testAll("tests of type", items, r => {
//     let responseType =
//       r->evalWithFoo->E.R2.fmap(ReducerInterface_InternalExpressionValue.valueToValueType)
//     let expectedOutputType = FooImplementation.fn1.output |> E.O.toExn("")
//     expect(responseType)->toEqual(Ok(expectedOutputType))
//   })
// })
