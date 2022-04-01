module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

let env: GenericDist_GenericOperation.env = {
  sampleCount: 1000,
  xyPointLength: 1000,
}

let runGenericOperation = GenericDist_GenericOperation.run(~env)

let arithmeticMap = r =>
  switch r {
  | "add" => #Add
  | "dotAdd" => #Add
  | "subtract" => #Subtract
  | "dotSubtract" => #Subtract
  | "divide" => #Divide
  | "logarithm" => #Divide
  | "dotDivide" => #Divide
  | "exponentiate" => #Exponentiate
  | "dotExponentiate" => #Exponentiate
  | "multiply" => #Multiply
  | "dotMultiply" => #Multiply
  | "dotLogarithm" => #Divide
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

module SymbolicConstructor = {
  let oneFloat = name =>
    switch name {
    | "exponential" => Ok(SymbolicDist.Exponential.make)
    | _ => Error("impossible path")
    }

  let twoFloat = name =>
    switch name {
    | "normal" => Ok(SymbolicDist.Normal.make)
    | "uniform" => Ok(SymbolicDist.Uniform.make)
    | "beta" => Ok(SymbolicDist.Beta.make)
    | "lognormal" => Ok(SymbolicDist.Lognormal.make)
    | _ => Error("impossible path")
    }

  let threeFloat = name =>
    switch name {
    | "triangular" => Ok(SymbolicDist.Triangular.make)
    | _ => Error("impossible path")
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
    SymbolicConstructor.oneFloat(fnName)
    ->E.R.bind(r => r(f1))
    ->SymbolicConstructor.symbolicResultToOutput
  | (("normal" | "uniform" | "beta" | "lognormal") as fnName, [EvNumber(f1), EvNumber(f2)]) =>
    SymbolicConstructor.twoFloat(fnName)
    ->E.R.bind(r => r(f1, f2))
    ->SymbolicConstructor.symbolicResultToOutput
  | ("triangular" as fnName, [EvNumber(f1), EvNumber(f2), EvNumber(f3)]) =>
    SymbolicConstructor.threeFloat(fnName)
    ->E.R.bind(r => r(f1, f2, f3))
    ->SymbolicConstructor.symbolicResultToOutput
  | ("sample", [EvDistribution(dist)]) => toFloatFn(#Sample, dist)
  | ("mean", [EvDistribution(dist)]) => toFloatFn(#Mean, dist)
  | ("normalize", [EvDistribution(dist)]) => toDistFn(Normalize, dist)
  | ("toPointSet", [EvDistribution(dist)]) => toDistFn(ToPointSet, dist)
  | ("cdf", [EvDistribution(dist), EvNumber(float)]) => toFloatFn(#Cdf(float), dist)
  | ("pdf", [EvDistribution(dist), EvNumber(float)]) => toFloatFn(#Pdf(float), dist)
  | ("inv", [EvDistribution(dist), EvNumber(float)]) => toFloatFn(#Inv(float), dist)
  | ("toSampleSet", [EvDistribution(dist), EvNumber(float)]) =>
    toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist)
  | ("truncateLeft", [EvDistribution(dist), EvNumber(float)]) =>
    toDistFn(Truncate(Some(float), None), dist)
  | ("truncateRight", [EvDistribution(dist), EvNumber(float)]) =>
    toDistFn(Truncate(None, Some(float)), dist)
  | ("truncate", [EvDistribution(dist), EvNumber(float1), EvNumber(float2)]) =>
    toDistFn(Truncate(Some(float1), Some(float2)), dist)
  | (("add" | "multiply" | "subtract" | "divide" | "exponentiate") as arithmetic, [a, b] as args) =>
    catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      twoDiststoDistFn(Algebraic, arithmetic, fst, snd)
    )
  | (
      ("dotAdd" | "dotMultiply" | "dotSubtract" | "dotDivide" | "dotExponentiate") as arithmetic,
      [a, b] as args,
    ) =>
    catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      twoDiststoDistFn(Pointwise, arithmetic, fst, snd)
    )
  | _ => None
  }
}

let dispatch = call => {
  dispatchToGenericOutput(call)->E.O2.fmap(genericOutputToReducerValue)
}
