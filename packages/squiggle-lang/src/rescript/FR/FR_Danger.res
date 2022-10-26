/* Notes: See commit 5ce0a6979d9f95d77e4ddbdffc40009de73821e3 for last commit which has more detailed helper functions. These might be useful when coming back to this code after a long time. */

open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Danger"
let requiresNamespace = true

module Combinatorics = {
  module Helpers = {
    let laplace = (successes, trials) => (successes +. 1.0) /. (trials +. 2.0)
    let factorial = Stdlib.Math.factorial
    let choose = (n, k) => factorial(n) /. (factorial(n -. k) *. factorial(k))
    let pow = (base, exp) => Js.Math.pow_float(~base, ~exp)
    let binomial = (n, k, p) => choose(n, k) *. pow(p, k) *. pow(1.0 -. p, n -. k)
  }
  module Lib = {
    let laplace = Function.make(
      ~name="laplace",
      ~nameSpace,
      ~requiresNamespace,
      ~output=EvtNumber,
      ~examples=[`Danger.laplace(1, 20)`],
      ~definitions=[DefineFn.Numbers.twoToOne("laplace", Helpers.laplace)],
      (),
    )
    let factorial = Function.make(
      ~name="factorial",
      ~nameSpace,
      ~requiresNamespace,
      ~output=EvtNumber,
      ~examples=[`Danger.factorial(20)`],
      ~definitions=[DefineFn.Numbers.oneToOne("factorial", Helpers.factorial)],
      (),
    )
    let choose = Function.make(
      ~name="choose",
      ~nameSpace,
      ~requiresNamespace,
      ~output=EvtNumber,
      ~examples=[`Danger.choose(1, 20)`],
      ~definitions=[DefineFn.Numbers.twoToOne("choose", Helpers.choose)],
      (),
    )
    let binomial = Function.make(
      ~name="binomial",
      ~nameSpace,
      ~requiresNamespace,
      ~output=EvtNumber,
      ~examples=[`Danger.binomial(1, 20, 0.5)`],
      ~definitions=[DefineFn.Numbers.threeToOne("binomial", Helpers.binomial)],
      (),
    )
  }
}

module Integration = {
  module Helpers = {
    let integrateFunctionBetweenWithNumIntegrationPoints = (
      aLambda,
      min: float,
      max: float,
      numIntegrationPoints: float, // cast as int?
      context,
      reducer,
    ) => {
      let applyFunctionAtFloatToFloatOption = (point: float) => {
        // Defined here so that it has access to context, reducer
        let pointAsInternalExpression = FunctionRegistry_Helpers.Wrappers.evNumber(point)
        let resultAsInternalExpression = Reducer_Lambda.doLambdaCall(
          aLambda,
          [pointAsInternalExpression],
          context,
          reducer,
        )
        let result = switch resultAsInternalExpression {
        | Reducer_T.IEvNumber(x) => Ok(x)
        | _ =>
          Error(
            "Error 1 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"->SqError.Message.REOther,
          )
        }
        result
      }
      // Variables are punctiliously defined because it's otherwise easy to make off-by one errors.
      let numTotalPoints = Belt.Float.toInt(numIntegrationPoints) // superflous declaration, but useful to keep track that we are interpreting "numIntegrationPoints" as the total number on which we evaluate the function, not e.g., as the inner integration points.
      let numInnerPoints = numTotalPoints - 2
      let numOuterPoints = 2
      let totalWeight = max -. min
      let weightForAnInnerPoint = totalWeight /. E.I.toFloat(numTotalPoints - 1)
      let weightForAnOuterPoint = totalWeight /. E.I.toFloat(numTotalPoints - 1) /. 2.0
      let innerPointIncrement = (max -. min) /. E.I.toFloat(numTotalPoints - 1)
      let innerXs = E.A.makeBy(numInnerPoints, i =>
        min +. Belt_Float.fromInt(i + 1) *. innerPointIncrement
      )
      // Gotcha: makeBy goes from 0 to (n-1): <https://rescript-lang.org/docs/manual/latest/api/belt/array#makeby>
      let ysOptions = E.A.fmap(innerXs, x => applyFunctionAtFloatToFloatOption(x))

      /* Logging, with a worked example. */
      // Useful for understanding what is happening.
      // assuming min = 0, max = 10, numTotalPoints=10, results below:
      let verbose = false
      if verbose {
        Js.Console.log2("numTotalPoints", numTotalPoints) // 5
        Js.Console.log2("numInnerPoints", numInnerPoints) // 3
        Js.Console.log2("numOuterPoints", numOuterPoints) // always 2
        Js.Console.log2("totalWeight", totalWeight) // 10 - 0 = 10
        Js.Console.log2("weightForAnInnerPoint", weightForAnInnerPoint) // 10/4 = 2.5
        Js.Console.log2("weightForAnOuterPoint", weightForAnOuterPoint) // 10/4/2 = 1.25
        Js.Console.log2(
          "weightForAnInnerPoint * numInnerPoints + weightForAnOuterPoint * numOuterPoints",
          weightForAnInnerPoint *. E.I.toFloat(numInnerPoints) +.
            weightForAnOuterPoint *. E.I.toFloat(numOuterPoints),
        ) // should be 10
        Js.Console.log2(
          "sum of weights == totalWeight",
          weightForAnInnerPoint *. E.I.toFloat(numInnerPoints) +.
            weightForAnOuterPoint *. E.I.toFloat(numOuterPoints) == totalWeight,
        ) // true
        Js.Console.log2("innerPointIncrement", innerPointIncrement) // (10-0)/4 = 2.5
        Js.Console.log2("innerXs", innerXs) // 2.5, 5, 7.5
        Js.Console.log2("ysOptions", ysOptions)
      }

      let result = switch E.A.R.firstErrorOrOpen(ysOptions) {
      | Ok(ys) => {
          let innerPointsSum = ys->E.A.reduce(0.0, (a, b) => a +. b)
          let resultWithOuterPoints = switch (
            applyFunctionAtFloatToFloatOption(min),
            applyFunctionAtFloatToFloatOption(max),
          ) {
          | (Ok(yMin), Ok(yMax)) => {
              let result =
                (yMin +. yMax) *. weightForAnOuterPoint +. innerPointsSum *. weightForAnInnerPoint
              let wrappedResult = result->Reducer_T.IEvNumber->Ok
              wrappedResult
            }

          | (Error(b), _) => Error(b)
          | (_, Error(b)) => Error(b)
          }
          resultWithOuterPoints
        }

      | Error(b) =>
        ("Integration error 2 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead." ++
        "Original error: " ++
        b->SqError.Message.toString)
        ->SqError.Message.REOther
        ->Error
      }
      result
    }
  }
  module Lib = {
    let integrateFunctionBetweenWithNumIntegrationPoints = Function.make(
      ~name="integrateFunctionBetweenWithNumIntegrationPoints",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=false,
      ~examples=[`Danger.integrateFunctionBetweenWithNumIntegrationPoints({|x| x+1}, 1, 10, 10)`],
      // For the example of integrating x => x+1 between 1 and 10,
      // result should be close to 58.5
      // [x^2/2 + x]1_10 = (100/2 + 10) - (1/2 + 1) = 60 - 1.5 = 58.5
      // https://www.wolframalpha.com/input?i=integrate+x%2B1+from+1+to+10
      ~definitions=[
        FnDefinition.make(
          ~name="integrateFunctionBetweenWithNumIntegrationPoints",
          ~inputs=[FRTypeLambda, FRTypeNumber, FRTypeNumber, FRTypeNumber],
          ~run=(inputs, context, reducer) => {
            let result = switch inputs {
            | [_, _, _, IEvNumber(0.0)] =>
              "Integration error 4 in Danger.integrate: Increment can't be 0."
              ->SqError.Message.REOther
              ->Error
            | [
                IEvLambda(aLambda),
                IEvNumber(min),
                IEvNumber(max),
                IEvNumber(numIntegrationPoints),
              ] =>
              Helpers.integrateFunctionBetweenWithNumIntegrationPoints(
                aLambda,
                min,
                max,
                numIntegrationPoints,
                context,
                reducer,
              )
            | _ =>
              Error(
                SqError.Message.REOther(
                  "Integration error 5 in Danger.integrate. Remember that inputs are (function, number (min), number (max), number(increment))",
                ),
              )
            }
            result
          },
          (),
        ),
      ],
      (),
    )
    let integrateFunctionBetweenWithEpsilon = Function.make(
      ~name="integrateFunctionBetweenWithEpsilon",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=false,
      ~examples=[`Danger.integrateFunctionBetweenWithEpsilon({|x| x+1}, 1, 10, 0.1)`],
      ~definitions=[
        FnDefinition.make(
          ~name="integrateFunctionBetweenWithEpsilon",
          ~inputs=[FRTypeLambda, FRTypeNumber, FRTypeNumber, FRTypeNumber],
          ~run=(inputs, context, reducer) => {
            let result = switch inputs {
            | [_, _, _, IEvNumber(0.0)] =>
              "Integration error in Danger.integrate: Increment can't be 0."
              ->SqError.Message.REOther
              ->Error
            | [IEvLambda(aLambda), IEvNumber(min), IEvNumber(max), IEvNumber(epsilon)] =>
              Helpers.integrateFunctionBetweenWithNumIntegrationPoints(
                aLambda,
                min,
                max,
                (max -. min) /. epsilon,
                context,
                reducer,
              )->E.R.errMap(b =>
                ("Integration error 7 in Danger.integrate. Something went wrong along the way: " ++
                b->SqError.Message.toString)->SqError.Message.REOther
              )
            | _ =>
              "Integration error 8 in Danger.integrate. Remember that inputs are (function, number (min), number (max), number(increment))"
              ->SqError.Message.REOther
              ->Error
            }
            result
          },
          (),
        ),
      ],
      (),
    )
  }
}

module DiminishingReturns = {
  module Helpers = {
    type diminishingReturnsAccumulatorInner = {
      optimalAllocations: array<float>,
      currentMarginalReturns: result<array<float>, errorMessage>,
    }
    let findBiggestElementIndex = (xs: array<float>) =>
      E.A.reducei(xs, 0, (acc, newElement, index) => {
        switch newElement > xs[acc] {
        | true => index
        | false => acc
        }
      })
    type diminishingReturnsAccumulator = result<diminishingReturnsAccumulatorInner, errorMessage>
    // TODO: This is so complicated, it probably should be its own file. It might also make sense to have it work in Rescript directly, taking in a function rather than a reducer; then something else can wrap that function in the reducer/lambdas/context.
    /*
    The key idea for this function is that 
    1. we keep track of past spending and current marginal returns for each function
    2. we look an additional increment in funds
    3. we assign it to the function with the best marginal returns
    4. we update the spending, and we compute the new returns for that function, with more spending
      - But we only compute the new marginal returns for the function we end up assigning the spending to.
    5. We continue doing this until all the funding is exhausted
    This is currently being done with a reducer, that keeps track of:
      - Value of marginal spending for each function
      - How much has been assigned to each function.
 */

    /*
      Two possible algorithms (n=funds/increment, m=num lambdas)
      1. O(n): Iterate through value on next n dollars. At each step, only compute the new marginal return of the function which is spent. (This is what we are doing.)
      2. O(n*(m-1)): Iterate through all possible spending combinations. The advantage of this option is that it wouldn't assume that the returns of marginal spending are diminishing.
 */
    let optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions = (
      lambdas,
      funds,
      approximateIncrement,
      context,
      reducer,
    ) => {
      switch (
        E.A.length(lambdas) > 1,
        funds > 0.0,
        approximateIncrement > 0.0,
        funds > approximateIncrement,
      ) {
      | (false, _, _, _) =>
        Error(
          "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, number of functions should be greater than 1."->SqError.Message.REOther,
        )
      | (_, false, _, _) =>
        Error(
          "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, funds should be greater than 0."->SqError.Message.REOther,
        )
      | (_, _, false, _) =>
        Error(
          "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be greater than 0."->SqError.Message.REOther,
        )
      | (_, _, _, false) =>
        Error(
          "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be smaller than funds amount."->SqError.Message.REOther,
        )
      | (true, true, true, true) => {
          let applyFunctionAtPoint = (lambda, point: float) => {
            // Defined here so that it has access to context, reducer
            let pointAsInternalExpression = FunctionRegistry_Helpers.Wrappers.evNumber(point)
            let resultAsInternalExpression = Reducer_Lambda.doLambdaCall(
              lambda,
              [pointAsInternalExpression],
              context,
              reducer,
            )
            switch resultAsInternalExpression {
            | Reducer_T.IEvNumber(x) => Ok(x)
            | _ =>
              Error(
                "Error 1 in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"->SqError.Message.REOther,
              )
            }
          }

          let numDivisions = Js.Math.round(funds /. approximateIncrement)
          let increment = funds /. numDivisions
          let arrayOfIncrements = Belt.Array.make(Belt.Float.toInt(numDivisions), increment)
          // ^ make the increment cleanly divide the amount of funds
          // nicely simplifies the calculations.

          let initAccumulator: diminishingReturnsAccumulator = Ok({
            optimalAllocations: Belt.Array.make(E.A.length(lambdas), 0.0),
            currentMarginalReturns: E.A.fmap(lambdas, lambda =>
              applyFunctionAtPoint(lambda, 0.0)
            )->E.A.R.firstErrorOrOpen,
          })

          let optimalAllocationEndAccumulator = E.A.reduce(arrayOfIncrements, initAccumulator, (
            acc,
            newIncrement,
          ) => {
            switch acc {
            | Ok(accInner) => {
                let oldMarginalReturnsWrapped = accInner.currentMarginalReturns
                let newAccWrapped = switch oldMarginalReturnsWrapped {
                | Ok(oldMarginalReturns) => {
                    let indexOfBiggestDMR = findBiggestElementIndex(oldMarginalReturns)
                    let newOptimalAllocations = Belt.Array.copy(accInner.optimalAllocations)
                    let newOptimalAllocationsi =
                      newOptimalAllocations[indexOfBiggestDMR] +. newIncrement
                    newOptimalAllocations[indexOfBiggestDMR] = newOptimalAllocationsi
                    let lambdai = lambdas[indexOfBiggestDMR]
                    let newMarginalResultsLambdai = applyFunctionAtPoint(
                      lambdai,
                      newOptimalAllocationsi,
                    )
                    let newCurrentMarginalReturns = switch newMarginalResultsLambdai {
                    | Ok(value) => {
                        let result = Belt.Array.copy(oldMarginalReturns)
                        result[indexOfBiggestDMR] = value
                        Ok(result)
                      }

                    | Error(b) => Error(b)
                    }

                    let newAcc: diminishingReturnsAccumulatorInner = {
                      optimalAllocations: newOptimalAllocations,
                      currentMarginalReturns: newCurrentMarginalReturns,
                    }
                    Ok(newAcc)
                  }

                | Error(b) => Error(b)
                }
                newAccWrapped
              }

            | Error(b) => Error(b)
            }
          })

          let optimalAllocationResult = switch optimalAllocationEndAccumulator {
          | Ok(inner) =>
            Ok(FunctionRegistry_Helpers.Wrappers.evArrayOfEvNumber(inner.optimalAllocations))
          | Error(b) => Error(b)
          }

          optimalAllocationResult
        }
      }
    }
  }
  module Lib = {
    let optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions = Function.make(
      ~name="optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions",
      ~nameSpace,
      ~output=EvtArray,
      ~requiresNamespace=false,
      ~examples=[
        `Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions([{|x| x+1}, {|y| 10}], 100, 0.01)`,
      ],
      ~definitions=[
        FnDefinition.make(
          ~name="optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions",
          ~inputs=[FRTypeArray(FRTypeLambda), FRTypeNumber, FRTypeNumber],
          ~run=(inputs, context, reducer) =>
            switch inputs {
            | [IEvArray(innerlambdas), IEvNumber(funds), IEvNumber(approximateIncrement)] => {
                let individuallyWrappedLambdas = innerlambdas->E.A.fmap(innerLambda => {
                  switch innerLambda {
                  | Reducer_T.IEvLambda(lambda) => Ok(lambda)
                  | _ =>
                    "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions. A member of the array wasn't a function"
                    ->SqError.Message.REOther
                    ->Error
                  }
                })
                let wrappedLambdas = E.A.R.firstErrorOrOpen(individuallyWrappedLambdas)
                let result = switch wrappedLambdas {
                | Ok(lambdas) => {
                    let result = Helpers.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions(
                      lambdas,
                      funds,
                      approximateIncrement,
                      context,
                      reducer,
                    )
                    result
                  }

                | Error(b) => Error(b)
                }
                result
              }

            | _ =>
              "Error in Danger.diminishingMarginalReturnsForTwoFunctions"
              ->SqError.Message.REOther
              ->Error
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
  Combinatorics.Lib.laplace,
  Combinatorics.Lib.factorial,
  Combinatorics.Lib.choose,
  Combinatorics.Lib.binomial,
  // Integration
  Integration.Lib.integrateFunctionBetweenWithNumIntegrationPoints,
  // ^ Integral in terms of function, min, max, epsilon (distance between points)
  // Execution time will be less predictable, because it
  // will depend on min, max and epsilon together,
  // as well and the complexity of the function
  Integration.Lib.integrateFunctionBetweenWithEpsilon,
  // ^ Integral in terms of function, min, max, num points
  // Note that execution time will be more predictable, because it
  // will only depend on num points and the complexity of the function

  // Diminishing marginal return functions
  DiminishingReturns.Lib.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions,
]
