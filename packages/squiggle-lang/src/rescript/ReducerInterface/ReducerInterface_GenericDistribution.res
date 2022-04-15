module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

let defaultSampleCount = 10000

let runGenericOperation = DistributionOperation.run(
  ~env={
    sampleCount: defaultSampleCount,
    xyPointLength: 1000,
  },
)

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
    | "dotLog" => #Logarithm
    | _ => #Multiply
    }

  let catchAndConvertTwoArgsToDists = (args: array<expressionValue>): option<(
    GenericDist_Types.genericDist,
    GenericDist_Types.genericDist,
  )> => {
    switch args {
    | [EvDistribution(a), EvDistribution(b)] => Some((a, b))
    | [EvNumber(a), EvDistribution(b)] => Some((GenericDist.fromFloat(a), b))
    | [EvDistribution(a), EvNumber(b)] => Some((a, GenericDist.fromFloat(b)))
    | _ => None
    }
  }

  let toFloatFn = (
    fnCall: GenericDist_Types.Operation.toFloat,
    dist: GenericDist_Types.genericDist,
  ) => {
    FromDist(GenericDist_Types.Operation.ToFloat(fnCall), dist)->runGenericOperation->Some
  }

  let toStringFn = (
    fnCall: GenericDist_Types.Operation.toString,
    dist: GenericDist_Types.genericDist,
  ) => {
    FromDist(GenericDist_Types.Operation.ToString(fnCall), dist)->runGenericOperation->Some
  }

  let toBoolFn = (
    fnCall: GenericDist_Types.Operation.toBool,
    dist: GenericDist_Types.genericDist,
  ) => {
    FromDist(GenericDist_Types.Operation.ToBool(fnCall), dist)->runGenericOperation->Some
  }

  let toDistFn = (fnCall: GenericDist_Types.Operation.toDist, dist) => {
    FromDist(GenericDist_Types.Operation.ToDist(fnCall), dist)->runGenericOperation->Some
  }

  let twoDiststoDistFn = (direction, arithmetic, dist1, dist2) => {
    FromDist(
      GenericDist_Types.Operation.ToDistCombination(
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

  let parseDist = (args: expressionValue): Belt.Result.t<GenericDist_Types.genericDist, string> =>
    switch args {
    | EvDistribution(x) => Ok(x)
    | EvNumber(x) => Ok(GenericDist.fromFloat(x))
    | _ => Error("Not a distribution")
    }

  let parseDistributionArray = (ags: array<expressionValue>): Belt.Result.t<
    array<GenericDist_Types.genericDist>,
    string,
  > => E.A.fmap(parseDist, ags) |> E.A.R.firstErrorOrOpen

  let mixtureWithGivenWeights = (
    distributions: array<GenericDist_Types.genericDist>,
    weights: array<float>,
  ): DistributionOperation.outputType =>
    E.A.length(distributions) == E.A.length(weights)
      ? Mixture(Belt.Array.zip(distributions, weights))->runGenericOperation
      : GenDistError(
          ArgumentError("Error, mixture call has different number of distributions and weights"),
        )

  let mixtureWithDefaultWeights = (
    distributions: array<GenericDist_Types.genericDist>,
  ): DistributionOperation.outputType => {
    let length = E.A.length(distributions)
    let weights = Belt.Array.make(length, 1.0 /. Belt.Int.toFloat(length))
    mixtureWithGivenWeights(distributions, weights)
  }

  let mixture = (args: array<expressionValue>): DistributionOperation.outputType => {
    switch E.A.last(args) {
    | Some(EvArray(b)) => {
        let weights = parseNumberArray(b)
        let distributions = parseDistributionArray(
          Belt.Array.slice(args, ~offset=0, ~len=E.A.length(args) - 1),
        )
        switch E.R.merge(distributions, weights) {
        | Ok(d, w) => mixtureWithGivenWeights(d, w)
        | Error(err) => GenDistError(ArgumentError(err))
        }
      }
    | Some(EvDistribution(b)) =>
      switch parseDistributionArray(args) {
      | Ok(distributions) => mixtureWithDefaultWeights(distributions)
      | Error(err) => GenDistError(ArgumentError(err))
      }
    | _ => GenDistError(ArgumentError("Last argument of mx must be array or distribution"))
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
    | Error(r) => Some(GenDistError(Other(r)))
    }
}

module Math = {
  let e = 2.718281828459
}

let dispatchToGenericOutput = (call: ExpressionValue.functionCall): option<
  DistributionOperation.outputType,
> => {
  let (fnName, args) = call
  switch (fnName, args) {
  | ("exponential" as fnName, [EvNumber(f1)]) =>
    SymbolicConstructors.oneFloat(fnName)
    ->E.R.bind(r => r(f1))
    ->SymbolicConstructors.symbolicResultToOutput
  | (
      ("normal" | "uniform" | "beta" | "lognormal" | "to") as fnName,
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
  | ("toString", [EvDistribution(dist)]) => Helpers.toStringFn(ToString, dist)
  | ("toSparkline", [EvDistribution(dist)]) => Helpers.toStringFn(ToSparkline(20), dist)
  | ("toSparkline", [EvDistribution(dist), EvNumber(n)]) =>
    Helpers.toStringFn(ToSparkline(Belt.Float.toInt(n)), dist)
  | ("exp", [EvDistribution(a)]) =>
    // https://mathjs.org/docs/reference/functions/exp.html
    Helpers.twoDiststoDistFn(Algebraic, "pow", GenericDist.fromFloat(Math.e), a)->Some
  | ("normalize", [EvDistribution(dist)]) => Helpers.toDistFn(Normalize, dist)
  | ("isNormalized", [EvDistribution(dist)]) => Helpers.toBoolFn(IsNormalized, dist)
  | ("toPointSet", [EvDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist)
  | ("cdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Cdf(float), dist)
  | ("pdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Pdf(float), dist)
  | ("inv", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Inv(float), dist)
  | ("toSampleSet", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist)
  | ("toSampleSet", [EvDistribution(dist)]) =>
    Helpers.toDistFn(ToSampleSet(defaultSampleCount), dist)
  | ("inspect", [EvDistribution(dist)]) =>
    Helpers.toDistFn(Inspect, dist)
  | ("truncateLeft", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(Some(float), None), dist)
  | ("truncateRight", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(None, Some(float)), dist)
  | ("truncate", [EvDistribution(dist), EvNumber(float1), EvNumber(float2)]) =>
    Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist)
  | ("mx" | "mixture", args) => Helpers.mixture(args)->Some
  | ("log", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Algebraic, "log", a, GenericDist.fromFloat(Math.e))->Some
  | ("log10", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Algebraic, "log", a, GenericDist.fromFloat(10.0))->Some
  | ("unaryMinus", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Algebraic, "multiply", a, GenericDist.fromFloat(-1.0))->Some
  | (("add" | "multiply" | "subtract" | "divide" | "pow" | "log") as arithmetic, [a, b] as args) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Algebraic, arithmetic, fst, snd)
    )
  | (
      ("dotAdd"
      | "dotMultiply"
      | "dotSubtract"
      | "dotDivide"
      | "dotPow"
      | "dotLog") as arithmetic,
      [a, b] as args,
    ) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Pointwise, arithmetic, fst, snd)
    )
  | ("dotLog", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Pointwise, "dotLog", a, GenericDist.fromFloat(Math.e))->Some
  | ("dotExp", [EvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(Pointwise, "dotPow", GenericDist.fromFloat(Math.e), a)->Some
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
  | GenDistError(NotYetImplemented) => Error(RETodo("Function not yet implemented"))
  | GenDistError(Unreachable) => Error(RETodo("Unreachable"))
  | GenDistError(DistributionVerticalShiftIsInvalid) =>
    Error(RETodo("Distribution Vertical Shift Is Invalid"))
  | GenDistError(ArgumentError(err)) => Error(RETodo("Argument Error: " ++ err))
  | GenDistError(Other(s)) => Error(RETodo(s))
  }

let dispatch = call => {
  dispatchToGenericOutput(call)->E.O2.fmap(genericOutputToReducerValue)
}
