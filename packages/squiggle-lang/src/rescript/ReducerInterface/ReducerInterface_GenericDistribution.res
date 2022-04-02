module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

let runGenericOperation = GenericDist_GenericOperation.run(
  ~env={
    sampleCount: 1000,
    xyPointLength: 1000,
  },
)

module Helpers = {
  let arithmeticMap = r =>
    switch r {
    | "add" => #Add
    | "pointwiseAdd" => #Add
    | "subtract" => #Subtract
    | "pointwiseSubtract" => #Subtract
    | "divide" => #Divide
    | "logarithm" => #Logarithm
    | "pointwiseDivide" => #Divide
    | "exponentiate" => #Exponentiate
    | "pointwiseExponentiate" => #Exponentiate
    | "multiply" => #Multiply
    | "pointwiseMultiply" => #Multiply
    | "pointwiseLogarithm" => #Logarithm
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
  ): option<GenericDist_GenericOperation.outputType> =>
    switch symbolicResult {
    | Ok(r) => Some(Dist(Symbolic(r)))
    | Error(r) => Some(GenDistError(Other(r)))
    }
}

let dispatchToGenericOutput = (call: ExpressionValue.functionCall): option<
  GenericDist_GenericOperation.outputType,
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
  | ("normalize", [EvDistribution(dist)]) => Helpers.toDistFn(Normalize, dist)
  | ("toPointSet", [EvDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist)
  | ("cdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Cdf(float), dist)
  | ("pdf", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Pdf(float), dist)
  | ("inv", [EvDistribution(dist), EvNumber(float)]) => Helpers.toFloatFn(#Inv(float), dist)
  | ("toSampleSet", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist)
  | ("truncateLeft", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(Some(float), None), dist)
  | ("truncateRight", [EvDistribution(dist), EvNumber(float)]) =>
    Helpers.toDistFn(Truncate(None, Some(float)), dist)
  | ("truncate", [EvDistribution(dist), EvNumber(float1), EvNumber(float2)]) =>
    Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist)
  | (
      ("add" | "multiply" | "subtract" | "divide" | "exponentiate" | "log") as arithmetic,
      [a, b] as args,
    ) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Algebraic, arithmetic, fst, snd)
    )
  | (
      ("pointwiseAdd"
      | "pointwiseMultiply"
      | "pointwiseSubtract"
      | "pointwiseDivide"
      | "pointwiseExponentiate"
      | "pointwiseLogarithm") as arithmetic,
      [a, b] as args,
    ) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Pointwise, arithmetic, fst, snd)
    )
  | _ => None
  }
}

let genericOutputToReducerValue = (o: GenericDist_GenericOperation.outputType): result<
  expressionValue,
  Reducer_ErrorValue.errorValue,
> =>
  switch o {
  | Dist(d) => Ok(ReducerInterface_ExpressionValue.EvDistribution(d))
  | Float(d) => Ok(EvNumber(d))
  | String(d) => Ok(EvString(d))
  | GenDistError(NotYetImplemented) => Error(RETodo("Function not yet implemented"))
  | GenDistError(Unreachable) => Error(RETodo("Unreachable"))
  | GenDistError(DistributionVerticalShiftIsInvalid) =>
    Error(RETodo("Distribution Vertical Shift is Invalid"))
  | GenDistError(Other(s)) => Error(RETodo(s))
  }

let dispatch = call => {
  dispatchToGenericOutput(call)->E.O2.fmap(genericOutputToReducerValue)
}
