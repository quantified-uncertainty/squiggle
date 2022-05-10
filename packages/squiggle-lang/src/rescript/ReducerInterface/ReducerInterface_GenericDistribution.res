module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

let defaultEnv: DistributionOperation.env = {
  sampleCount: MagicNumbers.Environment.defaultSampleCount,
  xyPointLength: MagicNumbers.Environment.defaultXYPointLength,
}

let runGenericOperation = DistributionOperation.run(~env=defaultEnv)

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
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToFloat(fnCall), dist)
    ->runGenericOperation
    ->Some
  }

  let toStringFn = (
    fnCall: DistributionTypes.DistributionOperation.toString,
    dist: DistributionTypes.genericDist,
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToString(fnCall), dist)
    ->runGenericOperation
    ->Some
  }

  let toBoolFn = (
    fnCall: DistributionTypes.DistributionOperation.toBool,
    dist: DistributionTypes.genericDist,
  ) => {
    FromDist(DistributionTypes.DistributionOperation.ToBool(fnCall), dist)
    ->runGenericOperation
    ->Some
  }

  let toDistFn = (fnCall: DistributionTypes.DistributionOperation.toDist, dist) => {
    FromDist(DistributionTypes.DistributionOperation.ToDist(fnCall), dist)
    ->runGenericOperation
    ->Some
  }

  let twoDiststoDistFn = (direction, arithmetic, dist1, dist2) => {
    FromDist(
      DistributionTypes.DistributionOperation.ToDistCombination(
        direction,
        arithmeticMap(arithmetic),
        #Dist(dist2),
      ),
      dist1,
    )->runGenericOperation
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
  ): DistributionOperation.outputType =>
    E.A.length(distributions) == E.A.length(weights)
      ? Mixture(Belt.Array.zip(distributions, weights))->runGenericOperation
      : GenDistError(
          ArgumentError("Error, mixture call has different number of distributions and weights"),
        )

  let mixtureWithDefaultWeights = (
    distributions: array<DistributionTypes.genericDist>,
  ): DistributionOperation.outputType => {
    let length = E.A.length(distributions)
    let weights = Belt.Array.make(length, 1.0 /. Belt.Int.toFloat(length))
    mixtureWithGivenWeights(distributions, weights)
  }

  let mixture = (args: array<expressionValue>): DistributionOperation.outputType => {
    let error = (err: string): DistributionOperation.outputType => err->DistributionTypes.ArgumentError->GenDistError
    switch args {
    | [EvArray(distributions)] =>
      switch parseDistributionArray(distributions) {
      | Ok(distrs) => mixtureWithDefaultWeights(distrs)
      | Error(err) => error(err)
      }
    | [EvArray(distributions), EvArray(weights)] =>
      switch (parseDistributionArray(distributions), parseNumberArray(weights)) {
      | (Ok(distrs), Ok(wghts)) => mixtureWithGivenWeights(distrs, wghts)
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
          | Ok(d, w) => mixtureWithGivenWeights(d, w)
          | Error(err) => error(err)
          }
        }
      | Some(EvNumber(_))
      | Some(EvDistribution(_)) =>
        switch parseDistributionArray(args) {
        | Ok(distributions) => mixtureWithDefaultWeights(distributions)
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
    | _ => Error("Unreachable state")
    }

  let twoFloat = name =>
    switch name {
    | "normal" => Ok(SymbolicDist.Normal.make)
    | "uniform" => Ok(SymbolicDist.Uniform.make)
    | "beta" => Ok(SymbolicDist.Beta.make)
    | "lognormal" => Ok(SymbolicDist.Lognormal.make)
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

let dispatchToGenericOutput = (call: ExpressionValue.functionCall, _environment): option<
  DistributionOperation.outputType,
> => {
  let (fnName, args) = call
  switch (fnName, args) {
  | ("exponential" as fnName, [EvNumber(f)]) =>
    SymbolicConstructors.oneFloat(fnName)
    ->E.R.bind(r => r(f))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("delta", [EvNumber(f)]) =>
    SymbolicDist.Float.makeSafe(f)->SymbolicConstructors.symbolicResultToOutput
  | (
      ("normal" | "uniform" | "beta" | "lognormal" | "cauchy" | "gamma" | "to") as fnName,
      [EvNumber(f1), EvNumber(f2)],
    ) =>
    SymbolicConstructors.twoFloat(fnName)
    ->E.R.bind(r => r(f1, f2))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("triangular" as fnName, [EvNumber(f1), EvNumber(f2), EvNumber(f3)]) =>
    SymbolicConstructors.threeFloat(fnName)
    ->E.R.bind(r => r(f1, f2, f3))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("sample", [EvDistribution(dist)]) => Helpers.toFloatFn(#Sample, dist)
  | ("mean", [EvDistribution(dist)]) => Helpers.toFloatFn(#Mean, dist)
  | ("integralSum", [EvDistribution(dist)]) => Helpers.toFloatFn(#IntegralSum, dist)
  | ("toString", [EvDistribution(dist)]) => Helpers.toStringFn(ToString, dist)
  | ("toSparkline", [EvDistribution(dist)]) => Helpers.toStringFn(ToSparkline(20), dist)
  | ("toSparkline", [EvDistribution(dist), EvNumber(n)]) =>
    Helpers.toStringFn(ToSparkline(Belt.Float.toInt(n)), dist)
  | ("exp", [EvDistribution(a)]) =>
    // https://mathjs.org/docs/reference/functions/exp.html
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "pow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
    )->Some
  | ("normalize", [EvDistribution(dist)]) => Helpers.toDistFn(Normalize, dist)
  | ("klDivergence", [EvDistribution(a), EvDistribution(b)]) =>
    Some(runGenericOperation(FromDist(ToScore(KLDivergence(b)), a)))
  | ("isNormalized", [EvDistribution(dist)]) => Helpers.toBoolFn(IsNormalized, dist)
  | ("toPointSet", [EvDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist)
  | ("scaleLog", [EvDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Logarithm, MagicNumbers.Math.e), dist)
  | ("scaleLog10", [EvDistribution(dist)]) => Helpers.toDistFn(Scale(#Logarithm, 10.0), dist)
  | ("scaleLog", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Logarithm, float), dist)
  | ("scaleLogWithThreshold", [EvDistribution(dist), EvNumber(base), EvNumber(eps)]) =>
    Helpers.toDistFn(Scale(#LogarithmWithThreshold(eps), base), dist)
  | ("scalePow", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Power, float), dist)
  | ("scaleExp", [EvDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Power, MagicNumbers.Math.e), dist)
  | ("cdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Cdf(float), dist)
  | ("pdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Pdf(float), dist)
  | ("inv", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Inv(float), dist)
  | ("toSampleSet", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist)
  | ("toSampleSet", [EvDistribution(dist)]) =>
    Helpers.toDistFn(ToSampleSet(MagicNumbers.Environment.defaultSampleCount), dist)
  | ("fromSamples", [EvArray(inputArray)]) => {
      let _wrapInputErrors = x => SampleSetDist.NonNumericInput(x)
      let parsedArray = Helpers.parseNumberArray(inputArray)->E.R2.errMap(_wrapInputErrors)
      switch parsedArray {
      | Ok(array) => runGenericOperation(FromSamples(array))
      | Error(e) => GenDistError(SampleSetError(e))
      }->Some
    }
  | ("inspect", [EvDistribution(dist)]) => Helpers.toDistFn(Inspect, dist)
  | ("truncateLeft", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(Some(float), None), dist)
  | ("truncateRight", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(None, Some(float)), dist)
  | ("truncate", [EvDistribution(dist), EvNumber(float1), EvNumber(float2)]) =>
    Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist)
  | ("mx" | "mixture", args) => Helpers.mixture(args)->Some
  | ("log", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(MagicNumbers.Math.e),
    )->Some
  | ("log10", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Algebraic(AsDefault), "log", a, GenericDist.fromFloat(10.0))->Some
  | ("unaryMinus", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Algebraic(AsDefault), "multiply", a, GenericDist.fromFloat(-1.0))->Some
  | (("add" | "multiply" | "subtract" | "divide" | "pow" | "log") as arithmetic, [_, _] as args) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Algebraic(AsDefault), arithmetic, fst, snd)
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
      Helpers.twoDiststoDistFn(Pointwise, arithmetic, fst, snd)
    )
  | ("dotExp", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Pointwise,
      "dotPow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
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
  | GenDistError(err) => Error(REDistributionError(err))
  }

let dispatch = (call, environment) => {
  dispatchToGenericOutput(call, environment)->E.O2.fmap(genericOutputToReducerValue)
}
