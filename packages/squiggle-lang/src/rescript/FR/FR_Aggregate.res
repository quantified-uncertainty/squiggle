open FunctionRegistry_Core
// open FunctionRegistry_Helpers

let nameSpace = "Aggregate"
let requiresNamespace = true

module AggregateFs = {
  module Helpers = {
    let geomMean = (xs: array<float>) => {
      let xsLogs = E.A.fmap(x => Js.Math.log2(x), xs)
      let sumXsLogs = E.A.reduce(xsLogs, 0.0, (a, b) => a +. b)
      let answer = Js.Math.pow_float(~base=2.0, ~exp=sumXsLogs)
      answer
    }
  }
  module Lib = {
    let geomMean = Function.make(
      ~name="geomMean",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=false,
      ~examples=[`Aggregate.id(1)`],
      ~definitions=[
        FnDefinition.make(
          ~name="id",
          ~inputs=[FRTypeArray(FRTypeNumber)],
          ~run=(inputs, _, _) =>
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

            | _ => "Error in Aggregate.id"->SqError.Message.REOther->Error
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
