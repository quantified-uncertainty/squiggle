//TODO: multimodal, add interface, test somehow, track performance, refactor sampleSet, refactor ASTEvaluator.res.
type t = GenericDist_Types.genericDist
type error = GenericDist_Types.error
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<array<float>, error>
type scaleMultiplyFn = (t, float) => result<t, error>
type pointwiseAddFn = (t, t) => result<t, error>

let sampleN = (t: t, n) =>
  switch t {
  | #PointSet(r) => Ok(PointSetDist.sampleNRendered(n, r))
  | #Symbolic(r) => Ok(SymbolicDist.T.sampleN(n, r))
  | #SampleSet(_) => Error(GenericDist_Types.NotYetImplemented)
  }

let fromFloat = (f: float) => #Symbolic(SymbolicDist.Float.make(f))

let toString = (t: t) =>
  switch t {
  | #PointSet(_) => "Point Set Distribution"
  | #Symbolic(r) => SymbolicDist.T.toString(r)
  | #SampleSet(_) => "Sample Set Distribution"
  }

let normalize = (t: t) =>
  switch t {
  | #PointSet(r) => #PointSet(PointSetDist.T.normalize(r))
  | #Symbolic(_) => t
  | #SampleSet(_) => t
  }

let operationToFloat = (toPointSet: toPointSetFn, fnName, t) => {
  let symbolicSolution = switch t {
  | #Symbolic(r) =>
    switch SymbolicDist.T.operate(fnName, r) {
    | Ok(f) => Some(f)
    | _ => None
    }
  | _ => None
  }

  switch symbolicSolution {
  | Some(r) => Ok(r)
  | None => toPointSet(t)->E.R.fmap2(PointSetDist.operate(fnName))
  }
}

//TODO: Refactor this bit.
let defaultSamplingInputs: SamplingInputs.samplingInputs = {
  sampleCount: 10000,
  outputXYPoints: 10000,
  pointSetDistLength: 1000,
  kernelWidth: None,
}

//Todo: If it's a pointSet, but the xyPointLenght is different from what it has, it should change.
// This is tricky because the case of discrete distributions.
let toPointSet = (t, xyPointLength): result<PointSetTypes.pointSetDist, error> => {
  switch t {
  | #PointSet(pointSet) => Ok(pointSet)
  | #Symbolic(r) => Ok(SymbolicDist.T.toPointSetDist(xyPointLength, r))
  | #SampleSet(r) => {
      let response = SampleSet.toPointSetDist(
        ~samples=r,
        ~samplingInputs=defaultSamplingInputs,
        (),
      ).pointSetDist
      switch response {
      | Some(r) => Ok(r)
      | None => Error(Other("Converting sampleSet to pointSet failed"))
      }
    }
  }
}

module Truncate = {
  let trySymbolicSimplification = (leftCutoff, rightCutoff, t): option<t> =>
    switch (leftCutoff, rightCutoff, t) {
    | (None, None, _) => None
    | (lc, rc, #Symbolic(#Uniform(u))) if lc < rc =>
      Some(#Symbolic(#Uniform(SymbolicDist.Uniform.truncate(lc, rc, u))))
    | _ => None
    }

  let run = (
    toPointSet: toPointSetFn,
    leftCutoff: option<float>,
    rightCutoff: option<float>,
    t: t,
  ): result<t, error> => {
    let doesNotNeedCutoff = E.O.isNone(leftCutoff) && E.O.isNone(rightCutoff)
    if doesNotNeedCutoff {
      Ok(t)
    } else {
      switch trySymbolicSimplification(leftCutoff, rightCutoff, t) {
      | Some(r) => Ok(r)
      | None =>
        toPointSet(t) |> E.R.fmap(t =>
          #PointSet(PointSetDist.T.truncate(leftCutoff, rightCutoff, t))
        )
      }
    }
  }
}

let truncate = Truncate.run

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution.

  TODO: It would be useful to be able to pass in a paramater to get this to run either with convolution or monte carlo.
*/
module AlgebraicCombination = {
  let tryAnalyticalSimplification = (
    operation: GenericDist_Types.Operation.arithmeticOperation,
    t1: t,
    t2: t,
  ): option<result<SymbolicDistTypes.symbolicDist, string>> =>
    switch (operation, t1, t2) {
    | (operation, #Symbolic(d1), #Symbolic(d2)) =>
      switch SymbolicDist.T.tryAnalyticalSimplification(d1, d2, operation) {
      | #AnalyticalSolution(symbolicDist) => Some(Ok(symbolicDist))
      | #Error(er) => Some(Error(er))
      | #NoSolution => None
      }
    | _ => None
    }

  let runConvolution = (
    toPointSet: toPointSetFn,
    operation: GenericDist_Types.Operation.arithmeticOperation,
    t1: t,
    t2: t,
  ) =>
    E.R.merge(toPointSet(t1), toPointSet(t2)) |> E.R.fmap(((a, b)) =>
      PointSetDist.combineAlgebraically(operation, a, b)
    )

  let runMonteCarlo = (
    toSampleSet: toSampleSetFn,
    operation: GenericDist_Types.Operation.arithmeticOperation,
    t1: t,
    t2: t,
  ) => {
    let operation = Operation.Algebraic.toFn(operation)
    E.R.merge(toSampleSet(t1), toSampleSet(t2)) |> E.R.fmap(((a, b)) => {
      Belt.Array.zip(a, b) |> E.A.fmap(((a, b)) => operation(a, b))
    })
  }

  //I'm (Ozzie) really just guessing here, very little idea what's best
  let expectedConvolutionCost: t => int = x =>
    switch x {
    | #Symbolic(#Float(_)) => 1
    | #Symbolic(_) => 1000
    | #PointSet(Discrete(m)) => m.xyShape |> XYShape.T.length
    | #PointSet(Mixed(_)) => 1000
    | #PointSet(Continuous(_)) => 1000
    | _ => 1000
    }

  let chooseConvolutionOrMonteCarlo = (t2: t, t1: t) =>
    expectedConvolutionCost(t1) * expectedConvolutionCost(t2) > 10000
      ? #CalculateWithMonteCarlo
      : #CalculateWithConvolution

  let run = (
    toPointSet: toPointSetFn,
    toSampleSet: toSampleSetFn,
    algebraicOp,
    t1: t,
    t2: t,
  ): result<t, error> => {
    switch tryAnalyticalSimplification(algebraicOp, t1, t2) {
    | Some(Ok(symbolicDist)) => Ok(#Symbolic(symbolicDist))
    | Some(Error(e)) => Error(Other(e))
    | None =>
      switch chooseConvolutionOrMonteCarlo(t1, t2) {
      | #CalculateWithMonteCarlo =>
        runMonteCarlo(toSampleSet, algebraicOp, t1, t2)->E.R.fmap2(r => #SampleSet(r))
      | #CalculateWithConvolution =>
        runConvolution(toPointSet, algebraicOp, t1, t2)->E.R.fmap2(r => #PointSet(r))
      }
    }
  }
}

let algebraicCombination = AlgebraicCombination.run

//TODO: Add faster pointwiseCombine fn
let pointwiseCombination = (toPointSet: toPointSetFn, operation, t2: t, t1: t): result<
  t,
  error,
> => {
  E.R.merge(toPointSet(t1), toPointSet(t2))
  ->E.R.fmap2(((t1, t2)) =>
    PointSetDist.combinePointwise(GenericDist_Types.Operation.arithmeticToFn(operation), t1, t2)
  )
  ->E.R.fmap2(r => #PointSet(r))
}

let pointwiseCombinationFloat = (
  toPointSet: toPointSetFn,
  operation: GenericDist_Types.Operation.arithmeticOperation,
  f: float,
  t: t,
): result<t, error> => {
  switch operation {
  | #Add | #Subtract => Error(GenericDist_Types.DistributionVerticalShiftIsInvalid)
  | (#Multiply | #Divide | #Exponentiate | #Log) as operation =>
    toPointSet(t)->E.R.fmap2(t => {
      //TODO: Move to PointSet codebase
      let fn = (secondary, main) => Operation.Scale.toFn(operation, main, secondary)
      let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(operation)
      let integralCacheFn = Operation.Scale.toIntegralCacheFn(operation)
      PointSetDist.T.mapY(
        ~integralSumCacheFn=integralSumCacheFn(f),
        ~integralCacheFn=integralCacheFn(f),
        ~fn=fn(f),
        t,
      )
    })
  }->E.R.fmap2(r => #PointSet(r))
}

//Note: The result should always cumulatively sum to 1.
let mixture = (
  scaleMultiply: scaleMultiplyFn,
  pointwiseAdd: pointwiseAddFn,
  values: array<(t, float)>,
) => {
  if E.A.length(values) == 0 {
    Error(GenericDist_Types.Other("mixture must have at least 1 element"))
  } else {
    let totalWeight = values->E.A.fmap2(E.Tuple2.second)->E.A.Floats.sum
    let properlyWeightedValues =
      values
      ->E.A.fmap2(((dist, weight)) => scaleMultiply(dist, weight /. totalWeight))
      ->E.A.R.firstErrorOrOpen
    properlyWeightedValues->E.R.bind(values => {
      values
      |> Js.Array.sliceFrom(1)
      |> E.A.fold_left(
        (acc, x) => E.R.bind(acc, acc => pointwiseAdd(acc, x)),
        Ok(E.A.unsafe_get(values, 0)),
      )
    })
  }
}
