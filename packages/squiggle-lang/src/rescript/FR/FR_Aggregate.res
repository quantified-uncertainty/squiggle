open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Example"
let requiresNamespace = true

module AggregateFs = {
  module Helpers = {
    let geomMean = (xs: array<float>) => 1.0
  }
  module Lib = {
    let geomMean = Function.make(
      ~name="geomMean",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=false,
      ~examples=[`Example.id(1)`],
      ~definitions=[
        FnDefinition.make(
          ~name="id",
          ~inputs=[FRTypeArray(FRTypeNumber)],
          ~run=(inputs, environment, reducer) =>
            switch inputs {
            | [IEvArray(innerNumbers)] => {
                let individuallyWrappedNumbers = E.A.fmap(innerNumber => {
                  switch innerNumber {
                  | Reducer_T.IEvNumber(x) => Ok(x)
                  | _ =>
                    "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions. A member of the array wasn't a function"
                    ->SqError.Message.REOther
                    ->Error
                  }
                }, innerNumbers)
                let wrappedNumbers = E.A.R.firstErrorOrOpen(individuallyWrappedNumbers)
                let result = switch wrappedNumbers {
                | Ok(numbers) => {
                    let result = Helpers.geomMean(numbers)
                    Ok(FunctionRegistry_Helpers.Wrappers.evNumber(result))
                  }

                | Error(b) => Error(b)
                }
                result
              }

            | _ => "Error in Example.id"->SqError.Message.REOther->Error
            },
          (),
        ),
      ],
      (),
    )
  }
}

let library = [
  // Combinatorics
  AggregateFs.Lib.geomMean,
]

// Then, to actually use,
// add the new functions to
// src/rescript/FunctionRegistry/FunctionRegistry_Library.res
