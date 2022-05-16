module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

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
    | [EvDistribution(a), EvDistribution(b)] => Some((a, b))
    | [EvNumber(a), EvDistribution(b)] => Some((GenericDist.fromFloat(a), b))
    | [EvDistribution(a), EvNumber(b)] => Some((a, GenericDist.fromFloat(b)))
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
    | EvNumber(x) => Ok(x)
    | _ => Error("Not a number")
    }

  let parseNumberArray = (ags: array<expressionValue>): Belt.Result.t<array<float>, string> =>
    E.A.fmap(parseNumber, ags) |> E.A.R.firstErrorOrOpen

  let parseDist = (args: expressionValue): Belt.Result.t<DistributionTypes.genericDist, string> =>
    switch args {
    | EvDistribution(x) => Ok(x)
    | EvNumber(x) => Ok(GenericDist.fromFloat(x))
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
    | [EvArray(distributions)] =>
      switch parseDistributionArray(distributions) {
      | Ok(distrs) => mixtureWithDefaultWeights(distrs, ~env)
      | Error(err) => error(err)
      }
    | [EvArray(distributions), EvArray(weights)] =>
      switch (parseDistributionArray(distributions), parseNumberArray(weights)) {
      | (Ok(distrs), Ok(wghts)) => mixtureWithGivenWeights(distrs, wghts, ~env)
      | (Error(err), Ok(_)) => error(err)
      | (Ok(_), Error(err)) => error(err)
      | (Error(err1), Error(err2)) => error(`${err1}|${err2}`)
      }
    | _ =>
      switch E.A.last(args) {
      | Some(EvArray(b)) => {
          let weights = parseNumberArray(b)
          let distributions = parseDistributionArray(
            Belt.Array.slice(args, ~offset=0, ~len=E.A.length(args) - 1),
          )
          switch E.R.merge(distributions, weights) {
          | Ok(d, w) => mixtureWithGivenWeights(d, w, ~env)
          | Error(err) => error(err)
          }
        }
      | Some(EvNumber(_))
      | Some(EvDistribution(_)) =>
        switch parseDistributionArray(args) {
        | Ok(distributions) => mixtureWithDefaultWeights(distributions, ~env)
        | Error(err) => error(err)
        }
      | _ => error("Last argument of mx must be array or distribution")
      }
    }
  }
}

module SymbolicConstructors = {
  let oneFloat = name =>
    switch name {
    | "exponential" => Ok(SymbolicDist.Exponential.make)
    | "bernoulli" => Ok(SymbolicDist.Bernoulli.make)
    | _ => Error("Unreachable state")
    }

  let twoFloat = name =>
    switch name {
    | "normal" => Ok(SymbolicDist.Normal.make)
    | "uniform" => Ok(SymbolicDist.Uniform.make)
    | "beta" => Ok(SymbolicDist.Beta.make)
    | "lognormal" => Ok(SymbolicDist.Lognormal.make)
    | "logistic" => Ok(SymbolicDist.Logistic.make)
    | "cauchy" => Ok(SymbolicDist.Cauchy.make)
    | "gamma" => Ok(SymbolicDist.Gamma.make)
    | "to" => Ok(SymbolicDist.From90thPercentile.make)
    | _ => Error("Unreachable state")
    }

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
  | (("exponential" | "bernoulli") as fnName, [EvNumber(f)]) =>
    SymbolicConstructors.oneFloat(fnName)
    ->E.R.bind(r => r(f))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("delta", [EvNumber(f)]) =>
    SymbolicDist.Float.makeSafe(f)->SymbolicConstructors.symbolicResultToOutput
  | (
      ("normal"
      | "uniform"
      | "beta"
      | "lognormal"
      | "cauchy"
      | "gamma"
      | "to"
      | "logistic") as fnName,
      [EvNumber(f1), EvNumber(f2)],
    ) =>
    SymbolicConstructors.twoFloat(fnName)
    ->E.R.bind(r => r(f1, f2))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("triangular" as fnName, [EvNumber(f1), EvNumber(f2), EvNumber(f3)]) =>
    SymbolicConstructors.threeFloat(fnName)
    ->E.R.bind(r => r(f1, f2, f3))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("sample", [EvDistribution(dist)]) => Helpers.toFloatFn(#Sample, dist, ~env)
  | ("sampleN", [EvDistribution(dist), EvNumber(n)]) =>
    Some(FloatArray(GenericDist.sampleN(dist, Belt.Int.fromFloat(n))))
  | ("mean", [EvDistribution(dist)]) => Helpers.toFloatFn(#Mean, dist, ~env)
  | ("integralSum", [EvDistribution(dist)]) => Helpers.toFloatFn(#IntegralSum, dist, ~env)
  | ("toString", [EvDistribution(dist)]) => Helpers.toStringFn(ToString, dist, ~env)
  | ("toSparkline", [EvDistribution(dist)]) => Helpers.toStringFn(ToSparkline(20), dist, ~env)
  | ("toSparkline", [EvDistribution(dist), EvNumber(n)]) =>
    Helpers.toStringFn(ToSparkline(Belt.Float.toInt(n)), dist, ~env)
  | ("exp", [EvDistribution(a)]) =>
    // https://mathjs.org/docs/reference/functions/exp.html
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "pow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
      ~env,
    )->Some
  | ("normalize", [EvDistribution(dist)]) => Helpers.toDistFn(Normalize, dist, ~env)
  | ("klDivergence", [EvDistribution(a), EvDistribution(b)]) =>
    Some(DistributionOperation.run(FromDist(ToScore(KLDivergence(b)), a), ~env))
  | ("isNormalized", [EvDistribution(dist)]) => Helpers.toBoolFn(IsNormalized, dist, ~env)
  | ("toPointSet", [EvDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist, ~env)
  | ("scaleLog", [EvDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Logarithm, MagicNumbers.Math.e), dist, ~env)
  | ("scaleLog10", [EvDistribution(dist)]) => Helpers.toDistFn(Scale(#Logarithm, 10.0), dist, ~env)
  | ("scaleLog", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Logarithm, float), dist, ~env)
  | ("scaleLogWithThreshold", [EvDistribution(dist), EvNumber(base), EvNumber(eps)]) =>
    Helpers.toDistFn(Scale(#LogarithmWithThreshold(eps), base), dist, ~env)
  | ("scalePow", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Power, float), dist, ~env)
  | ("scaleExp", [EvDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Power, MagicNumbers.Math.e), dist, ~env)
  | ("cdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Cdf(float), dist, ~env)
  | ("pdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Pdf(float), dist, ~env)
  | ("inv", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Inv(float), dist, ~env)
  | ("toSampleSet", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist, ~env)
  | ("toSampleSet", [EvDistribution(dist)]) =>
    Helpers.toDistFn(ToSampleSet(env.sampleCount), dist, ~env)
  | ("fromSamples", [EvArray(inputArray)]) => {
      let _wrapInputErrors = x => SampleSetDist.NonNumericInput(x)
      let parsedArray = Helpers.parseNumberArray(inputArray)->E.R2.errMap(_wrapInputErrors)
      switch parsedArray {
      | Ok(array) => DistributionOperation.run(FromSamples(array), ~env)
      | Error(e) => GenDistError(SampleSetError(e))
      }->Some
    }
  | ("inspect", [EvDistribution(dist)]) => Helpers.toDistFn(Inspect, dist, ~env)
  | ("truncateLeft", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(Some(float), None), dist, ~env)
  | ("truncateRight", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(None, Some(float)), dist, ~env)
  | ("truncate", [EvDistribution(dist), EvNumber(float1), EvNumber(float2)]) =>
    Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist, ~env)
  | ("mx" | "mixture", args) => Helpers.mixture(args, ~env)->Some
  | ("log", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(MagicNumbers.Math.e),
      ~env,
    )->Some
  | ("log10", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(10.0),
      ~env,
    )->Some
  | ("unaryMinus", [EvDistribution(a)]) =>
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
  | ("dotExp", [EvDistribution(a)]) =>
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
  | Dist(d) => Ok(ReducerInterface_ExpressionValue.EvDistribution(d))
  | Float(d) => Ok(EvNumber(d))
  | String(d) => Ok(EvString(d))
  | Bool(d) => Ok(EvBool(d))
  | FloatArray(d) => Ok(EvArray(d |> E.A.fmap(r => ReducerInterface_ExpressionValue.EvNumber(r))))
  | GenDistError(err) => Error(REDistributionError(err))
  }

let dispatch = (call, environment) => {
  dispatchToGenericOutput(call, environment)->E.O2.fmap(genericOutputToReducerValue)
}
