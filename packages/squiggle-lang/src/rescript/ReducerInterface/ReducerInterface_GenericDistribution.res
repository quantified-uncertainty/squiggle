module ExpressionValue = ReducerInterface_InternalExpressionValue
type expressionValue = ExpressionValue.expressionValue

module Helpers = {
  let arithmeticMap = r =>
    switch r {
    | "add" => #Add
    | "dotAdd" => #Add
    | "subtract" => #Subtract
    | "dotSubtract" => #Subtract
    | "divide" => #Divide
    | "log" => #Logarithm
    | "dotDivide" => #Divide
    | "pow" => #Power
    | "dotPow" => #Power
    | "multiply" => #Multiply
    | "dotMultiply" => #Multiply
    | _ => #Multiply
    }

  let catchAndConvertTwoArgsToDists = (args: array<expressionValue>): option<(
    DistributionTypes.genericDist,
    DistributionTypes.genericDist,
  )> =>
    switch args {
    | [IevDistribution(a), IevDistribution(b)] => Some((a, b))
    | [IevNumber(a), IevDistribution(b)] => Some((GenericDist.fromFloat(a), b))
    | [IevDistribution(a), IevNumber(b)] => Some((a, GenericDist.fromFloat(b)))
    | _ => None
    }

  let toFloatFn = (
    fnCall: DistributionTypes.DistributionOperation.toFloat,
    dist: DistributionTypes.genericDist,
    ~env: DistributionOperation.env,
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToFloat(fnCall), dist)
    ->DistributionOperation.run(~env)
    ->Some
  }

  let toStringFn = (
    fnCall: DistributionTypes.DistributionOperation.toString,
    dist: DistributionTypes.genericDist,
    ~env: DistributionOperation.env,
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToString(fnCall), dist)
    ->DistributionOperation.run(~env)
    ->Some
  }

  let toBoolFn = (
    fnCall: DistributionTypes.DistributionOperation.toBool,
    dist: DistributionTypes.genericDist,
    ~env: DistributionOperation.env,
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToBool(fnCall), dist)
    ->DistributionOperation.run(~env)
    ->Some
  }

  let toDistFn = (
    fnCall: DistributionTypes.DistributionOperation.toDist,
    dist,
    ~env: DistributionOperation.env,
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToDist(fnCall), dist)
    ->DistributionOperation.run(~env)
    ->Some
  }

  let twoDiststoDistFn = (direction, arithmetic, dist1, dist2, ~env: DistributionOperation.env) => {
    FromDist(
      DistributionTypes.DistributionOperation.ToDistCombination(
        direction,
        arithmeticMap(arithmetic),
        #Dist(dist2),
      ),
      dist1,
    )->DistributionOperation.run(~env)
  }

  let parseNumber = (args: expressionValue): Belt.Result.t<float, string> =>
    switch args {
    | IevNumber(x) => Ok(x)
    | _ => Error("Not a number")
    }

  let parseNumberArray = (ags: array<expressionValue>): Belt.Result.t<array<float>, string> =>
    E.A.fmap(parseNumber, ags) |> E.A.R.firstErrorOrOpen

  let parseDist = (args: expressionValue): Belt.Result.t<DistributionTypes.genericDist, string> =>
    switch args {
    | IevDistribution(x) => Ok(x)
    | IevNumber(x) => Ok(GenericDist.fromFloat(x))
    | _ => Error("Not a distribution")
    }

  let parseDistributionArray = (ags: array<expressionValue>): Belt.Result.t<
    array<DistributionTypes.genericDist>,
    string,
  > => E.A.fmap(parseDist, ags) |> E.A.R.firstErrorOrOpen

  let mixtureWithGivenWeights = (
    distributions: array<DistributionTypes.genericDist>,
    weights: array<float>,
    ~env: DistributionOperation.env,
  ): DistributionOperation.outputType =>
    E.A.length(distributions) == E.A.length(weights)
      ? Mixture(Belt.Array.zip(distributions, weights))->DistributionOperation.run(~env)
      : GenDistError(
          ArgumentError("Error, mixture call has different number of distributions and weights"),
        )

  let mixtureWithDefaultWeights = (
    distributions: array<DistributionTypes.genericDist>,
    ~env: DistributionOperation.env,
  ): DistributionOperation.outputType => {
    let length = E.A.length(distributions)
    let weights = Belt.Array.make(length, 1.0 /. Belt.Int.toFloat(length))
    mixtureWithGivenWeights(distributions, weights, ~env)
  }

  let mixture = (
    args: array<expressionValue>,
    ~env: DistributionOperation.env,
  ): DistributionOperation.outputType => {
    let error = (err: string): DistributionOperation.outputType =>
      err->DistributionTypes.ArgumentError->GenDistError
    switch args {
    | [IevArray(distributions)] =>
      switch parseDistributionArray(distributions) {
      | Ok(distrs) => mixtureWithDefaultWeights(distrs, ~env)
      | Error(err) => error(err)
      }
    | [IevArray(distributions), IevArray(weights)] =>
      switch (parseDistributionArray(distributions), parseNumberArray(weights)) {
      | (Ok(distrs), Ok(wghts)) => mixtureWithGivenWeights(distrs, wghts, ~env)
      | (Error(err), Ok(_)) => error(err)
      | (Ok(_), Error(err)) => error(err)
      | (Error(err1), Error(err2)) => error(`${err1}|${err2}`)
      }
    | _ =>
      switch E.A.last(args) {
      | Some(IevArray(b)) => {
          let weights = parseNumberArray(b)
          let distributions = parseDistributionArray(
            Belt.Array.slice(args, ~offset=0, ~len=E.A.length(args) - 1),
          )
          switch E.R.merge(distributions, weights) {
          | Ok(d, w) => mixtureWithGivenWeights(d, w, ~env)
          | Error(err) => error(err)
          }
        }
      | Some(IevNumber(_))
      | Some(IevDistribution(_)) =>
        switch parseDistributionArray(args) {
        | Ok(distributions) => mixtureWithDefaultWeights(distributions, ~env)
        | Error(err) => error(err)
        }
      | _ => error("Last argument of mx must be array or distribution")
      }
    }
  }

  let klDivergenceWithPrior = (
    prediction: DistributionTypes.genericDist,
    answer: DistributionTypes.genericDist,
    prior: DistributionTypes.genericDist,
    env: DistributionOperation.env,
  ) => {
    let term1 = DistributionOperation.Constructors.klDivergence(~env, prediction, answer)
    let term2 = DistributionOperation.Constructors.klDivergence(~env, prior, answer)
    switch E.R.merge(term1, term2)->E.R2.fmap(((a, b)) => a -. b) {
    | Ok(x) => x->DistributionOperation.Float->Some
    | Error(_) => None
    }
  }
}

module SymbolicConstructors = {
  let threeFloat = name =>
    switch name {
    | "triangular" => Ok(SymbolicDist.Triangular.make)
    | _ => Error("Unreachable state")
    }

  let symbolicResultToOutput = (
    symbolicResult: result<SymbolicDistTypes.symbolicDist, string>,
  ): option<DistributionOperation.outputType> =>
    switch symbolicResult {
    | Ok(r) => Some(Dist(Symbolic(r)))
    | Error(r) => Some(GenDistError(OtherError(r)))
    }
}

let dispatchToGenericOutput = (
  call: ExpressionValue.functionCall,
  env: DistributionOperation.env,
): option<DistributionOperation.outputType> => {
  let (fnName, args) = call
  switch (fnName, args) {
  | ("triangular" as fnName, [IevNumber(f1), IevNumber(f2), IevNumber(f3)]) =>
    SymbolicConstructors.threeFloat(fnName)
    ->E.R.bind(r => r(f1, f2, f3))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("sample", [IevDistribution(dist)]) => Helpers.toFloatFn(#Sample, dist, ~env)
  | ("sampleN", [IevDistribution(dist), IevNumber(n)]) =>
    Some(FloatArray(GenericDist.sampleN(dist, Belt.Int.fromFloat(n))))
  | (("mean" | "stdev" | "variance" | "min" | "max" | "mode") as op, [IevDistribution(dist)]) => {
      let fn = switch op {
      | "mean" => #Mean
      | "stdev" => #Stdev
      | "variance" => #Variance
      | "min" => #Min
      | "max" => #Max
      | "mode" => #Mode
      | _ => #Mean
      }
      Helpers.toFloatFn(fn, dist, ~env)
    }
  | ("integralSum", [IevDistribution(dist)]) => Helpers.toFloatFn(#IntegralSum, dist, ~env)
  | ("toString", [IevDistribution(dist)]) => Helpers.toStringFn(ToString, dist, ~env)
  | ("toSparkline", [IevDistribution(dist)]) =>
    Helpers.toStringFn(ToSparkline(MagicNumbers.Environment.sparklineLength), dist, ~env)
  | ("toSparkline", [IevDistribution(dist), IevNumber(n)]) =>
    Helpers.toStringFn(ToSparkline(Belt.Float.toInt(n)), dist, ~env)
  | ("exp", [IevDistribution(a)]) =>
    // https://mathjs.org/docs/reference/functions/exp.html
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "pow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
      ~env,
    )->Some
  | ("normalize", [IevDistribution(dist)]) => Helpers.toDistFn(Normalize, dist, ~env)
  | ("klDivergence", [IevDistribution(prediction), IevDistribution(answer)]) =>
    Some(DistributionOperation.run(FromDist(ToScore(KLDivergence(answer)), prediction), ~env))
  | (
      "klDivergence",
      [IevDistribution(prediction), IevDistribution(answer), IevDistribution(prior)],
    ) =>
    Helpers.klDivergenceWithPrior(prediction, answer, prior, env)
  | (
    "logScoreWithPointAnswer",
    [IevDistribution(prediction), IevNumber(answer), IevDistribution(prior)],
  )
  | (
    "logScoreWithPointAnswer",
    [
      IevDistribution(prediction),
      IevDistribution(Symbolic(#Float(answer))),
      IevDistribution(prior),
    ],
  ) =>
    DistributionOperation.run(
      FromDist(ToScore(LogScore(answer, prior->Some)), prediction),
      ~env,
    )->Some
  | ("logScoreWithPointAnswer", [IevDistribution(prediction), IevNumber(answer)])
  | (
    "logScoreWithPointAnswer",
    [IevDistribution(prediction), IevDistribution(Symbolic(#Float(answer)))],
  ) =>
    DistributionOperation.run(FromDist(ToScore(LogScore(answer, None)), prediction), ~env)->Some
  | ("isNormalized", [IevDistribution(dist)]) => Helpers.toBoolFn(IsNormalized, dist, ~env)
  | ("toPointSet", [IevDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist, ~env)
  | ("scaleLog", [IevDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Logarithm, MagicNumbers.Math.e), dist, ~env)
  | ("scaleLog10", [IevDistribution(dist)]) => Helpers.toDistFn(Scale(#Logarithm, 10.0), dist, ~env)
  | ("scaleLog", [IevDistribution(dist), IevNumber(float)]) =>
    Helpers.toDistFn(Scale(#Logarithm, float), dist, ~env)
  | ("scaleLogWithThreshold", [IevDistribution(dist), IevNumber(base), IevNumber(eps)]) =>
    Helpers.toDistFn(Scale(#LogarithmWithThreshold(eps), base), dist, ~env)
  | ("scalePow", [IevDistribution(dist), IevNumber(float)]) =>
    Helpers.toDistFn(Scale(#Power, float), dist, ~env)
  | ("scaleExp", [IevDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Power, MagicNumbers.Math.e), dist, ~env)
  | ("cdf", [IevDistribution(dist), IevNumber(float)]) => Helpers.toFloatFn(#Cdf(float), dist, ~env)
  | ("pdf", [IevDistribution(dist), IevNumber(float)]) => Helpers.toFloatFn(#Pdf(float), dist, ~env)
  | ("inv", [IevDistribution(dist), IevNumber(float)]) => Helpers.toFloatFn(#Inv(float), dist, ~env)
  | ("toSampleSet", [IevDistribution(dist), IevNumber(float)]) =>
    Helpers.toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist, ~env)
  | ("toSampleSet", [IevDistribution(dist)]) =>
    Helpers.toDistFn(ToSampleSet(env.sampleCount), dist, ~env)
  | ("toList", [IevDistribution(SampleSet(dist))]) => Some(FloatArray(SampleSetDist.T.get(dist)))
  | ("fromSamples", [IevArray(inputArray)]) => {
      let _wrapInputErrors = x => SampleSetDist.NonNumericInput(x)
      let parsedArray = Helpers.parseNumberArray(inputArray)->E.R2.errMap(_wrapInputErrors)
      switch parsedArray {
      | Ok(array) => DistributionOperation.run(FromSamples(array), ~env)
      | Error(e) => GenDistError(SampleSetError(e))
      }->Some
    }
  | ("inspect", [IevDistribution(dist)]) => Helpers.toDistFn(Inspect, dist, ~env)
  | ("truncateLeft", [IevDistribution(dist), IevNumber(float)]) =>
    Helpers.toDistFn(Truncate(Some(float), None), dist, ~env)
  | ("truncateRight", [IevDistribution(dist), IevNumber(float)]) =>
    Helpers.toDistFn(Truncate(None, Some(float)), dist, ~env)
  | ("truncate", [IevDistribution(dist), IevNumber(float1), IevNumber(float2)]) =>
    Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist, ~env)
  | ("mx" | "mixture", args) => Helpers.mixture(args, ~env)->Some
  | ("log", [IevDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(MagicNumbers.Math.e),
      ~env,
    )->Some
  | ("log10", [IevDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(10.0),
      ~env,
    )->Some
  | ("unaryMinus", [IevDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "multiply",
      a,
      GenericDist.fromFloat(-1.0),
      ~env,
    )->Some
  | (("add" | "multiply" | "subtract" | "divide" | "pow" | "log") as arithmetic, [_, _] as args) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Algebraic(AsDefault), arithmetic, fst, snd, ~env)
    )
  | (
      ("dotAdd"
      | "dotMultiply"
      | "dotSubtract"
      | "dotDivide"
      | "dotPow") as arithmetic,
      [_, _] as args,
    ) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Pointwise, arithmetic, fst, snd, ~env)
    )
  | ("dotExp", [IevDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Pointwise,
      "dotPow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
      ~env,
    )->Some
  | _ => None
  }
}

let genericOutputToReducerValue = (o: DistributionOperation.outputType): result<
  expressionValue,
  Reducer_ErrorValue.errorValue,
> =>
  switch o {
  | Dist(d) => Ok(ReducerInterface_InternalExpressionValue.IevDistribution(d))
  | Float(d) => Ok(IevNumber(d))
  | String(d) => Ok(IevString(d))
  | Bool(d) => Ok(IevBool(d))
  | FloatArray(d) =>
    Ok(IevArray(d |> E.A.fmap(r => ReducerInterface_InternalExpressionValue.IevNumber(r))))
  | GenDistError(err) => Error(REDistributionError(err))
  }

let dispatch = (call: ExpressionValue.functionCall, environment) =>
  dispatchToGenericOutput(call, environment)->E.O2.fmap(genericOutputToReducerValue)
