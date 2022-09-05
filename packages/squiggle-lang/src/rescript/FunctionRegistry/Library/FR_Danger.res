open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Danger"
let requiresNamespace = true

module NNumbersToNumber = {
  module One = {
    let make = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber],
        ~run=(_, inputs, _, _) => {
          inputs
          ->getOrError(0)
          ->E.R.bind(Prepare.oneNumber)
          ->E.R2.fmap(fn)
          ->E.R2.fmap(Wrappers.evNumber)
        },
        (),
      )
  }

  module Two = {
    let make = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _, _) => {
          inputs->Prepare.ToValueTuple.twoNumbers->E.R2.fmap(fn)->E.R2.fmap(Wrappers.evNumber)
        },
        (),
      )
  }

  module Three = {
    let make = (name, fn) =>
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber, FRTypeNumber, FRTypeNumber],
        ~run=(_, inputs, _, _) => {
          inputs->Prepare.ToValueTuple.threeNumbers->E.R2.fmap(fn)->E.R2.fmap(Wrappers.evNumber)
        },
        (),
      )
  }
}

module Internals = {
  // Probability functions
  let factorial = Stdlib.Math.factorial
  let choose = ((n, k)) => factorial(n) /. (factorial(n -. k) *. factorial(k))
  let pow = (base, exp) => Js.Math.pow_float(~base, ~exp)
  let binomial = ((n, k, p)) => choose((n, k)) *. pow(p, k) *. pow(1.0 -. p, n -. k)

  // Integral helper functions
  let applyFunctionAtPoint = (
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
  let castFloatToInternalNumber = x => ReducerInterface_InternalExpressionValue.IEvNumber(x)
  let castArrayOfFloatsToInternalArrayOfInternals = xs => ReducerInterface_InternalExpressionValue.IEvArray(Belt.Array.map(xs, x => castFloatToInternalNumber(x)))
  @dead let applyFunctionAtFloat = (aLambda, point, environment, reducer) =>
    // reason for existence: might be an useful template to have for calculating diminishing marginal returns later on
    applyFunctionAtPoint(aLambda, castFloatToInternalNumber(point), environment, reducer)
  // integrate function itself
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
      let pointAsInternalExpression = ReducerInterface_InternalExpressionValue.IEvNumber(point)
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
          "Integration error 1 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead",
        )
      | _ => Error("Integration error 2 in Danger.integrate")
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

    let result = switch E.A.length(ysOptions) == E.A.length(okYs) {
    | true => {
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
      }
    | false =>
      Error(
        "Integration error 3 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead",
      )
    }
    result
  }
  let diminishingMarginalReturnsSkeleton = (
    lambda1,
    lambda2,
    funds, 
    increment,
    environment,
    reducer,
  ) => {
    Ok(castArrayOfFloatsToInternalArrayOfInternals([0.0, 1.0]))
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
      NNumbersToNumber.Two.make("laplace", ((successes, trials)) =>
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
    ~definitions=[NNumbersToNumber.One.make("factorial", Internals.factorial)],
    (),
  ),
  Function.make(
    ~name="choose",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.choose(1, 20)`],
    ~definitions=[NNumbersToNumber.Two.make("choose", Internals.choose)],
    (),
  ),
  Function.make(
    ~name="binomial",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`Danger.binomial(1, 20, 0.5)`],
    ~definitions=[NNumbersToNumber.Three.make("binomial", Internals.binomial)],
    (),
  ),
  // Helper functions building up to the integral
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
    Function.make(
    ~name="diminishingMarginalReturnsSkeleton",
    ~nameSpace,
    ~output=EvtArray,
    ~requiresNamespace=false,
    ~examples=[`Danger.diminishingMarginalReturnsSkeleton({|x| x+1}, {|y| 10}, 100, 1)`],
    ~definitions=[
      FnDefinition.make(
        ~name="diminishingMarginalReturnsSkeleton",
        ~inputs=[FRTypeLambda, FRTypeLambda, FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, env, reducer) =>
          switch inputs {
          | [IEvLambda(lambda1), IEvLambda(lambda2), IEvNumber(funds), IEvNumber(increment)] =>
            Internals.diminishingMarginalReturnsSkeleton(lambda1, lambda2, funds, increment, env, reducer)
          | _ => Error("Error in Danger.diminishingMarginalReturnsSkeleton")
          },
        (),
      ),
    ],
    (),
  ),
]
