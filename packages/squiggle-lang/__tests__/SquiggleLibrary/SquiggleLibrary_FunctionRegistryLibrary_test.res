open Jest
open Expect

let expectEvalToBeOk = (expr: string) =>
  Reducer.evaluate(expr)->Reducer_Helpers.rRemoveDefaultsExternal->E.R.isOk->expect->toBe(true)

let registry = FunctionRegistry_Library.registry
let examples = E.A.to_list(FunctionRegistry_Core.Registry.allExamples(registry))

describe("Fn auto-testing", () => {
  testAll("tests of validity", examples, r => {
    expectEvalToBeOk(r)
  })

  testAll(
    "tests of type",
    E.A.to_list(
      FunctionRegistry_Core.Registry.allExamplesWithFns(registry)->E.A2.filter(((fn, _)) =>
        E.O.isSome(fn.output)
      ),
    ),
    ((fn, example)) => {
      let responseType =
        example
        ->Reducer.evaluate
        ->E.R2.fmap(ReducerInterface_InternalExpressionValue.externalValueToValueType)
      let expectedOutputType = fn.output |> E.O.toExn("")
      expect(responseType)->toEqual(Ok(expectedOutputType))
    },
  )
})
