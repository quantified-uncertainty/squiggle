open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Danger"
let requiresNamespace = true

module Internals = {
  // Probability functions
  let factorial = Stdlib.Math.factorial
  let choose = ((n, k)) => factorial(n) /. (factorial(n -. k) *. factorial(k))
  let pow = (base, exp) => Js.Math.pow_float(~base, ~exp)
  let binomial = ((n, k, p)) => choose((n, k)) *. pow(p, k) *. pow(1.0 -. p, n -. k)

  let castArrayOfFloatsToInternalArrayOfInternals = xs =>
    xs
    ->Belt.Array.map(FunctionRegistry_Helpers.Wrappers.evNumber)
    ->FunctionRegistry_Helpers.Wrappers.evArray

  /* Helper functions. May be useful in 3 months when coming back to this code.
  @dead let applyFunctionAtPoint = (
    aLambda,
    internalNumber: internalExpressionValue,
    environment,
    reducer,
  ): result<ReducerInterface_InternalExpressionValue.t, Reducer_ErrorValue.errorValue> => {
    let result = Reducer_Expression_Lambda.doLambdaCall(
      aLambda,
      list{internalNumber},
      environment,
      reducer,
    )
    result
  }
  @dead let applyFunctionAtFloat = (aLambda, point, environment, reducer) =>
    // reason for existence: might be an useful template to have for calculating diminishing marginal returns later on
    applyFunctionAtPoint(aLambda, castFloatToInternalNumber(point), environment, reducer)
  // integrate function itself
 */
  let integrateFunctionBetweenWithNumIntegrationPoints = (
    aLambda,
    min: float,
    max: float,
    numIntegrationPoints: float, // cast as int?
    environment,
    reducer,
  ) => {
    let applyFunctionAtFloatToFloatOption = (point: float) => {
      // Defined here so that it has access to environment, reducer
      let pointAsInternalExpression = FunctionRegistry_Helpers.Wrappers.evNumber(point)
      let resultAsInternalExpression = Reducer_Expression_Lambda.doLambdaCall(
        aLambda,
        list{pointAsInternalExpression},
        environment,
        reducer,
      )
      let result = switch resultAsInternalExpression {
      | Ok(IEvNumber(x)) => Ok(x)
      | Error(_) =>
        Error(
          "Error 1 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead",
        )
      | _ => Error("Error 2 in Danger.integrate")
      }
      result
    }
    // worked example in comments below, assuming min=0, max = 10
    let numTotalPoints = Belt.Float.toInt(numIntegrationPoints) // superflous declaration, but useful to keep track that we are interpreting "numIntegrationPoints" as the total number on which we evaluate the function, not e.g., as the inner integration points.
    let numInnerPoints = numTotalPoints - 2
    let numOuterPoints = 2
    let totalWeight = max -. min
    let weightForAnInnerPoint = totalWeight /. E.I.toFloat(numTotalPoints - 1)
    let weightForAnOuterPoint = totalWeight /. E.I.toFloat(numTotalPoints - 1) /. 2.0
    let innerPointIncrement = (max -. min) /. E.I.toFloat(numTotalPoints - 1)
    let innerXs = Belt.Array.makeBy(numInnerPoints, i =>
      min +. Belt_Float.fromInt(i + 1) *. innerPointIncrement
    )
    // Gotcha: makeBy goes from 0 to (n-1): <https://rescript-lang.org/docs/manual/latest/api/belt/array#makeby>
    let ysOptions = Belt.Array.map(innerXs, x => applyFunctionAtFloatToFloatOption(x))
    let okYs = E.A.R.filterOk(ysOptions)

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
      Js.Console.log2("okYs", okYs)
    }

    //This is pretty hacky. It should use a result type instead of checking that length matches.
    let result = if E.A.length(ysOptions) == E.A.length(okYs) {
      let innerPointsSum = okYs->E.A.reduce(0.0, (a, b) => a +. b)
      let resultWithOuterPoints = switch (
        applyFunctionAtFloatToFloatOption(min),
        applyFunctionAtFloatToFloatOption(max),
      ) {
      | (Ok(yMin), Ok(yMax)) => {
          let result =
            (yMin +. yMax) *. weightForAnOuterPoint +. innerPointsSum *. weightForAnInnerPoint
          let wrappedResult = result->ReducerInterface_InternalExpressionValue.IEvNumber->Ok
          wrappedResult
        }
      | (Error(b), _) => Error(b)
      | (_, Error(b)) => Error(b)
      }
      resultWithOuterPoints
    } else {
      Error(
        "Integration error 3 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead",
      )
    }
    result
  }

  // Diminishing returns
  // Helpers
  type diminishingReturnsAccumulatorInner = {
    optimalAllocations: array<float>,
    currentMarginalReturns: result<array<float>, string>,
  }

  //Also can be done by Js.Math.max_int
  let findBiggestElementIndex = xs =>
    E.A.reducei(xs, 0, (acc, newElement, index) => {
      switch newElement > xs[acc] {
      | true => index
      | false => acc
      }
    })
  type diminishingReturnsAccumulator = result<diminishingReturnsAccumulatorInner, string>
  /* Simple function. May be useful for remembering how this works when I come back to this code weeks or months from now.
  @dead let diminishingMarginalReturnsForTwoFunctions = (
    // left alive for now because I know it works.
    lambda1,
    lambda2,
    funds,
    approximateIncrement,
    environment,
    reducer,
  ) => {
    /*
    Two possible algorithms (n=funds/increment, m=num lambdas)
    1. O(n): Iterate through value on next n dollars. At each step, only compute the new marginal return of the function which is spent
    2. O(n*m): Iterate through all possible spending combinations. Fun is, it doesn't assume that the returns of marginal spending are diminishing.
 */
    let applyFunctionAtFloatToFloatOption = (lambda, point: float) => {
      // Defined here so that it has access to environment, reducer
      let pointAsInternalExpression = castFloatToInternalNumber(point)
      let resultAsInternalExpression = Reducer_Expression_Lambda.doLambdaCall(
        lambda,
        list{pointAsInternalExpression},
        environment,
        reducer,
      )
      let result = switch resultAsInternalExpression {
      | Ok(IEvNumber(x)) => Ok(x)
      | Error(_) =>
        Error(
          "Integration error 1 in Danger.diminishingMarginalReturnsForTwoFunctions. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead",
        )
      | _ => Error("Integration error 2 in Danger.diminishingMarginalReturnsForTwoFunctions")
      }
      result
    }

    let numDivisions = Js.Math.round(funds /. approximateIncrement)
    let numDivisionsInt = Belt.Float.toInt(numDivisions)
    let increment = funds /. numDivisions
    let arrayOfIncrements = Belt.Array.makeBy(numDivisionsInt, _ => increment)

    let initAccumulator: diminishingReturnsAccumulator = Ok({
      optimalAllocations: [0.0, 0.0],
      currentMarginalReturns: E.A.R.firstErrorOrOpen([
        applyFunctionAtFloatToFloatOption(lambda1, 0.0),
        applyFunctionAtFloatToFloatOption(lambda2, 0.0),
      ]),
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
              let newOptimalAllocationsi = newOptimalAllocations[indexOfBiggestDMR] +. newIncrement
              newOptimalAllocations[indexOfBiggestDMR] = newOptimalAllocationsi
              let lambdai = indexOfBiggestDMR == 0 ? lambda1 : lambda2 // to do: generalize
              let newMarginalResultsLambdai = applyFunctionAtFloatToFloatOption(
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
      /* let findSmaller = (_) => 0
      let smallerDMR = 
      acc
 */
    })
    let optimalAllocationResult = switch optimalAllocationEndAccumulator {
    | Ok(inner) => Ok(castArrayOfFloatsToInternalArrayOfInternals(inner.optimalAllocations))
    | Error(b) => Error(b)
    }
    optimalAllocationResult
  }*/
  //TODO: This is so complicated, it probably should be its own file. It might also make sense to have it work in Rescript directly, taking in a function rather than a reducer; then something else can wrap that function in the reducer/lambdas/environment.
  let diminishingMarginalReturnsForManyFunctions = (
    lambdas,
    funds,
    approximateIncrement,
    environment,
    reducer,
  ) => {
    /*
    Two possible algorithms (n=funds/increment, m=num lambdas)
    1. O(n): Iterate through value on next n dollars. At each step, only compute the new marginal return of the function which is spent
    2. O(n*m): Iterate through all possible spending combinations. Fun is, it doesn't assume that the returns of marginal spending are diminishing.
 */
    let applyFunctionAtPoint = (lambda, point: float) => {
      // Defined here so that it has access to environment, reducer
      let pointAsInternalExpression = FunctionRegistry_Helpers.Wrappers.evNumber(point)
      let resultAsInternalExpression = Reducer_Expression_Lambda.doLambdaCall(
        lambda,
        list{pointAsInternalExpression},
        environment,
        reducer,
      )
      switch resultAsInternalExpression {
      | Ok(IEvNumber(x)) => Ok(x)
      | Error(_) =>
        Error(
          "Error 1 in Danger.diminishingMarginalReturnsForManyFunctions. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead",
        )
      | _ => Error("Error 2 in Danger.diminishingMarginalReturnsForManyFunctions")
      }
    }

    let numDivisions = Js.Math.round(funds /. approximateIncrement)
    let increment = funds /. numDivisions
    let arrayOfIncrements = Belt.Array.make(Belt.Float.toInt(numDivisions), increment)

    let initAccumulator: diminishingReturnsAccumulator = Ok({
      optimalAllocations: Belt.Array.make(E.A.length(lambdas), 0.0),
      currentMarginalReturns: E.A.fmap(
        lambda => applyFunctionAtPoint(lambda, 0.0),
        lambdas,
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
              let newOptimalAllocationsi = newOptimalAllocations[indexOfBiggestDMR] +. newIncrement
              newOptimalAllocations[indexOfBiggestDMR] = newOptimalAllocationsi
              let lambdai = lambdas[indexOfBiggestDMR]
              let newMarginalResultsLambdai = applyFunctionAtPoint(lambdai, newOptimalAllocationsi)
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
    | Ok(inner) => Ok(castArrayOfFloatsToInternalArrayOfInternals(inner.optimalAllocations))
    | Error(b) => Error(b)
    }

    optimalAllocationResult
    // let result = [0.0, 0.0]->castArrayOfFloatsToInternalArrayOfInternals->Ok
    // result
    // ^ useful for debugging.
  }
}

let library = [
  Function.make(
    ~name="laplace",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.laplace(1, 20)`],
    ~definitions=[
      DefineFn.Numbers.twoToOne("laplace", ((successes, trials)) =>
        (successes +. 1.0) /. (trials +. 2.0)
      ),
    ],
    (),
  ),
  Function.make(
    ~name="factorial",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.factorial(20)`],
    ~definitions=[DefineFn.Numbers.oneToOne("factorial", Internals.factorial)],
    (),
  ),
  Function.make(
    ~name="choose",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.choose(1, 20)`],
    ~definitions=[DefineFn.Numbers.twoToOne("choose", Internals.choose)],
    (),
  ),
  Function.make(
    ~name="binomial",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.binomial(1, 20, 0.5)`],
    ~definitions=[DefineFn.Numbers.threeToOne("binomial", Internals.binomial)],
    (),
  ),
  // Helper functions building up to the integral
  /* Initial functions that helped me build understanding, may help when coming back to the code weeks or months from now.
  Function.make(
    ~name="applyFunctionAtZero",
    ~nameSpace,
    ~output=EvtNumber,
    ~requiresNamespace=false,
    ~examples=[`Danger.applyFunctionAtZero({|x| x+1})`],
    ~definitions=[
      FnDefinition.make(
        ~name="applyFunctionAtZero",
        ~inputs=[FRTypeLambda],
        ~run=(inputs, _, environment, reducer) => {
          let result = switch inputs {
          | [IEvLambda(aLambda)] =>
            Internals.applyFunctionAtPoint(
              aLambda,
              Internals.castFloatToInternalNumber(0.0),
              environment,
              reducer,
            )->E.R2.errMap(_ => "Error!")
          | _ => Error(impossibleError)
          }
          result
        },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="applyFunctionAtPoint",
    ~nameSpace,
    ~output=EvtNumber,
    ~requiresNamespace=false,
    ~examples=[`Danger.applyFunctionAtPoint({|x| x+1}, 1)`],
    ~definitions=[
      FnDefinition.make(
        ~name="applyFunctionAtPoint",
        ~inputs=[FRTypeLambda, FRTypeNumber],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvLambda(aLambda), point] =>
            Internals.applyFunctionAtPoint(aLambda, point, env, reducer)->E.R2.errMap(_ => "Error!")
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  ),
 */
  // Integral in terms of function, min, max, num points
  // Note that execution time will be more predictable, because it
  // will only depend on num points and the complexity of the function
  Function.make(
    ~name="integrateFunctionBetweenWithNumIntegrationPoints",
    ~nameSpace,
    ~output=EvtNumber,
    ~requiresNamespace=false,
    ~examples=[`Danger.integrateFunctionBetweenWithNumIntegrationPoints({|x| x+1}, 1, 10, 10)`],
    // should be [x^2/2 + x]1_10 = (100/2 + 10) - (1/2 + 1) = 60 - 1.5 = 58.5
    // https://www.wolframalpha.com/input?i=integrate+x%2B1+from+1+to+10
    ~definitions=[
      FnDefinition.make(
        ~name="integrateFunctionBetweenWithNumIntegrationPoints",
        ~inputs=[FRTypeLambda, FRTypeNumber, FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, env, reducer) => {
          let result = switch inputs {
          | [_, _, _, IEvNumber(0.0)] =>
            Error("Integration error 4 in Danger.integrate: Increment can't be 0.")
          | [IEvLambda(aLambda), IEvNumber(min), IEvNumber(max), IEvNumber(numIntegrationPoints)] =>
            Internals.integrateFunctionBetweenWithNumIntegrationPoints(
              aLambda,
              min,
              max,
              numIntegrationPoints,
              env,
              reducer,
            )
          | _ =>
            Error(
              "Integration error 5 in Danger.integrate. Remember that inputs are (function, number (min), number (max), number(increment))",
            )
          }
          result
        },
        (),
      ),
    ],
    (),
  ),
  // Integral in terms of function, min, max, epsilon (distance between points)
  // Note that execution time will be less predictable, because it
  // will depend on min, max and epsilon together,
  // as well and the complexity of the function
  Function.make(
    ~name="integrateFunctionBetweenWithEpsilon",
    ~nameSpace,
    ~output=EvtNumber,
    ~requiresNamespace=false,
    ~examples=[`Danger.integrateFunctionBetweenWithEpsilon({|x| x+1}, 1, 10, 0.1)`],
    ~definitions=[
      FnDefinition.make(
        ~name="integrateFunctionBetweenWithEpsilon",
        ~inputs=[FRTypeLambda, FRTypeNumber, FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, env, reducer) => {
          let result = switch inputs {
          | [_, _, _, IEvNumber(0.0)] =>
            Error("Integration error in Danger.integrate: Increment can't be 0.")
          | [IEvLambda(aLambda), IEvNumber(min), IEvNumber(max), IEvNumber(epsilon)] =>
            Internals.integrateFunctionBetweenWithNumIntegrationPoints(
              aLambda,
              min,
              max,
              (max -. min) /. epsilon,
              env,
              reducer,
            )->E.R2.errMap(_ =>
              "Integration error 7 in Danger.integrate. Something went wrong along the way"
            )
          | _ =>
            Error(
              "Integration error 8 in Danger.integrate. Remember that inputs are (function, number (min), number (max), number(increment))",
            )
          }
          result
        },
        (),
      ),
    ],
    (),
  ),
  // Diminishing marginal return functions
  // There are functions diminishingMarginalReturnsForFunctions2 through diminishingMarginalReturnsForFunctions7
  // Because of this bug: <https://github.com/quantified-uncertainty/squiggle/issues/1090>
  // As soon as that is fixed, I will destroy this monstrosity.
  Function.make(
    ~name="diminishingMarginalReturnsForFunctions2",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[`Danger.diminishingMarginalReturnsForFunctions2({|x| 20-x}, {|y| 10}, 100, 0.01)`],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForFunctions2",
        ~inputs=[FRTypeLambda, FRTypeLambda, FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvLambda(lambda1),
              IEvLambda(lambda2),
              IEvNumber(funds),
              IEvNumber(approximateIncrement),
            ] =>
            Internals.diminishingMarginalReturnsForManyFunctions(
              [lambda1, lambda2],
              funds,
              approximateIncrement,
              env,
              reducer,
            )
          | _ => Error("Error in Danger.diminishingMarginalReturnsForFunctions2")
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="diminishingMarginalReturnsForFunctions3",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[
      `Danger.diminishingMarginalReturnsForFunctions3({|x| x+1}, {|y| 10}, {|z| 20-2*z}, 100, 0.01)`,
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForFunctions3",
        ~inputs=[FRTypeLambda, FRTypeLambda, FRTypeLambda, FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvLambda(lambda1),
              IEvLambda(lambda2),
              IEvLambda(lambda3),
              IEvNumber(funds),
              IEvNumber(approximateIncrement),
            ] =>
            Internals.diminishingMarginalReturnsForManyFunctions(
              [lambda1, lambda2, lambda3],
              funds,
              approximateIncrement,
              env,
              reducer,
            )
          | _ => Error("Error in Danger.diminishingMarginalReturnsForFunctions3")
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="diminishingMarginalReturnsForFunctions4",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[
      `Danger.diminishingMarginalReturnsForFunctions4({|x| x+1}, {|y| 10}, {|z| 20-2*z}, {|a| 15-a}, 100, 0.01)`,
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForFunctions4",
        ~inputs=[
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeNumber,
          FRTypeNumber,
        ],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvLambda(lambda1),
              IEvLambda(lambda2),
              IEvLambda(lambda3),
              IEvLambda(lambda4),
              IEvNumber(funds),
              IEvNumber(approximateIncrement),
            ] =>
            Internals.diminishingMarginalReturnsForManyFunctions(
              [lambda1, lambda2, lambda3, lambda4],
              funds,
              approximateIncrement,
              env,
              reducer,
            )
          | _ => Error("Error in Danger.diminishingMarginalReturnsForFunctions4")
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="diminishingMarginalReturnsForFunctions5",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[
      `Danger.diminishingMarginalReturnsForFunctions5({|x| x+1}, {|y| 10}, {|z| 20-2*z}, {|a| 15-a}, {|b| 17-b}, 100, 0.01)`,
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForFunctions5",
        ~inputs=[
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeNumber,
          FRTypeNumber,
        ],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvLambda(lambda1),
              IEvLambda(lambda2),
              IEvLambda(lambda3),
              IEvLambda(lambda4),
              IEvLambda(lambda5),
              IEvNumber(funds),
              IEvNumber(approximateIncrement),
            ] =>
            Internals.diminishingMarginalReturnsForManyFunctions(
              [lambda1, lambda2, lambda3, lambda4, lambda5],
              funds,
              approximateIncrement,
              env,
              reducer,
            )
          | _ => Error("Error in Danger.diminishingMarginalReturnsForFunctions5")
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="diminishingMarginalReturnsForFunctions6",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[
      `Danger.diminishingMarginalReturnsForFunctions6({|x| x+1}, {|y| 10}, {|z| 20-2*z}, {|a| 15-a}, {|b| 17-b}, {|c| 19-c}, 100, 0.01)`,
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForFunctions6",
        ~inputs=[
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeNumber,
          FRTypeNumber,
        ],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvLambda(lambda1),
              IEvLambda(lambda2),
              IEvLambda(lambda3),
              IEvLambda(lambda4),
              IEvLambda(lambda5),
              IEvLambda(lambda6),
              IEvNumber(funds),
              IEvNumber(approximateIncrement),
            ] =>
            Internals.diminishingMarginalReturnsForManyFunctions(
              [lambda1, lambda2, lambda3, lambda4, lambda5, lambda6],
              funds,
              approximateIncrement,
              env,
              reducer,
            )
          | _ => Error("Error in Danger.diminishingMarginalReturnsForFunctions6")
          },
        (),
      ),
    ],
    (),
  ),
  Function.make(
    ~name="diminishingMarginalReturnsForFunctions7",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[
      `Danger.diminishingMarginalReturnsForFunctions7({|x| x+1}, {|y| 10}, {|z| 20-2*z}, {|a| 15-a}, {|b| 17-b}, {|c| 19-c}, {|d| 20-d/2}, 100, 0.01)`,
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForFunctions7",
        ~inputs=[
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeLambda,
          FRTypeNumber,
          FRTypeNumber,
        ],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [
              IEvLambda(lambda1),
              IEvLambda(lambda2),
              IEvLambda(lambda3),
              IEvLambda(lambda4),
              IEvLambda(lambda5),
              IEvLambda(lambda6),
              IEvLambda(lambda7),
              IEvNumber(funds),
              IEvNumber(approximateIncrement),
            ] =>
            Internals.diminishingMarginalReturnsForManyFunctions(
              [lambda1, lambda2, lambda3, lambda4, lambda5, lambda6, lambda7],
              funds,
              approximateIncrement,
              env,
              reducer,
            )
          | _ => Error("Error in Danger.diminishingMarginalReturnsForFunctions4")
          },
        (),
      ),
    ],
    (),
  ),
  // The following will compile, but not work, because of this bug: <https://github.com/quantified-uncertainty/squiggle/issues/558> Instead, I am creating different functions for different numbers of inputs above.
  /*
  Function.make(
    ~name="diminishingMarginalReturnsForManyFunctions",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[
      `Danger.diminishingMarginalReturnsForManyFunctions([{|x| x+1}, {|y| 10}], 100, 0.01)`,
    ],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsForManyFunctions",
        ~inputs=[FRTypeArray(FRTypeLambda), FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, environment, reducer) =>
          switch inputs {
          | [IEvArray(innerlambdas), IEvNumber(funds), IEvNumber(approximateIncrement)] => {
              let individuallyWrappedLambdas = E.A.fmap(innerLambda => {
                switch innerLambda {
                | ReducerInterface_InternalExpressionValue.IEvLambda(lambda) => Ok(lambda)
                | _ =>
                  Error(
                    "Error in Danger.diminishingMarginalReturnsForManyFunctions. A member of the array wasn't a function",
                  )
                }
              }, innerlambdas)
              let wrappedLambdas = E.A.R.firstErrorOrOpen(individuallyWrappedLambdas)
              let result = switch wrappedLambdas {
              | Ok(lambdas) => {
                  let result = Internals.diminishingMarginalReturnsForManyFunctions(
                    lambdas,
                    funds,
                    approximateIncrement,
                    environment,
                    reducer,
                  )
                  result
                }
              | Error(b) => Error(b)
              }
              result //Error("wtf man")
            }
          | _ => Error("Error in Danger.diminishingMarginalReturnsForTwoFunctions")
          },
        (),
      ),
    ],
    (),
  ),
 */
]
