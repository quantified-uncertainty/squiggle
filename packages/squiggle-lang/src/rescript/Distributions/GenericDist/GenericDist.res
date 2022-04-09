//TODO: multimodal, add interface, test somehow, track performance, refactor sampleSet, refactor ASTEvaluator.res.
type t = GenericDist_Types.genericDist
type error = GenericDist_Types.error
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<array<float>, error>
type scaleMultiplyFn = (t, float) => result<t, error>
type pointwiseAddFn = (t, t) => result<t, error>

let sampleN = (t: t, n) =>
  switch t {
  | PointSet(r) => Ok(PointSetDist.sampleNRendered(n, r))
  | Symbolic(r) => Ok(SymbolicDist.T.sampleN(n, r))
  | SampleSet(r) => Ok(SampleSet.sampleN(r, n))
  }

let fromFloat = (f: float): t => Symbolic(SymbolicDist.Float.make(f))

let toString = (t: t) =>
  switch t {
  | PointSet(_) => "Point Set Distribution"
  | Symbolic(r) => SymbolicDist.T.toString(r)
  | SampleSet(_) => "Sample Set Distribution"
  }

let normalize = (t: t): t =>
  switch t {
  | PointSet(r) => PointSet(PointSetDist.T.normalize(r))
  | Symbolic(_) => t
  | SampleSet(_) => t
  }

let toFloatOperation = (
  t,
  ~toPointSetFn: toPointSetFn,
  ~distToFloatOperation: Operation.distToFloatOperation,
) => {
  let symbolicSolution = switch (t: t) {
  | Symbolic(r) =>
    switch SymbolicDist.T.operate(distToFloatOperation, r) {
    | Ok(f) => Some(f)
    | _ => None
    }
  | _ => None
  }

  switch symbolicSolution {
  | Some(r) => Ok(r)
  | None => toPointSetFn(t)->E.R2.fmap(PointSetDist.operate(distToFloatOperation))
  }
}

//Todo: If it's a pointSet, but the xyPointLength is different from what it has, it should change.
// This is tricky because the case of discrete distributions.
// Also, change the outputXYPoints/pointSetDistLength details
let toPointSet = (
  t,
  ~xyPointLength,
  ~sampleCount,
  ~xSelection: GenericDist_Types.Operation.pointsetXSelection=#ByWeight,
  unit,
): result<PointSetTypes.pointSetDist, error> => {
  switch (t: t) {
  | PointSet(pointSet) => Ok(pointSet)
  | Symbolic(r) => Ok(SymbolicDist.T.toPointSetDist(~xSelection, xyPointLength, r))
  | SampleSet(r) => {
      let response = SampleSet.toPointSetDist(
        ~samples=r,
        ~samplingInputs={
          sampleCount: sampleCount,
          outputXYPoints: xyPointLength,
          pointSetDistLength: xyPointLength,
          kernelWidth: None,
        },
        (),
      ).pointSetDist
      switch response {
      | Some(r) => Ok(r)
      | None => Error(Other("Converting sampleSet to pointSet failed"))
      }
    }
  }
}

let toSparkline = (t: t, ~sampleCount: int, ~buckets: int=20, unit): result<string, error> =>
  t
  ->toPointSet(~xSelection=#Linear, ~xyPointLength=buckets * 3, ~sampleCount, ())
  ->E.R.bind(r =>
    r->PointSetDist.toSparkline(buckets)->E.R2.errMap(r => Error(GenericDist_Types.Other(r)))
  )

module Truncate = {
  let trySymbolicSimplification = (leftCutoff, rightCutoff, t: t): option<t> =>
    switch (leftCutoff, rightCutoff, t) {
    | (None, None, _) => None
    | (lc, rc, Symbolic(#Uniform(u))) if lc < rc =>
      Some(Symbolic(#Uniform(SymbolicDist.Uniform.truncate(lc, rc, u))))
    | _ => None
    }

  let run = (
    t: t,
    ~toPointSetFn: toPointSetFn,
    ~leftCutoff=None: option<float>,
    ~rightCutoff=None: option<float>,
    (),
  ): result<t, error> => {
    let doesNotNeedCutoff = E.O.isNone(leftCutoff) && E.O.isNone(rightCutoff)
    if doesNotNeedCutoff {
      Ok(t)
    } else {
      switch trySymbolicSimplification(leftCutoff, rightCutoff, t) {
      | Some(r) => Ok(r)
      | None =>
        toPointSetFn(t)->E.R2.fmap(t => {
          GenericDist_Types.PointSet(PointSetDist.T.truncate(leftCutoff, rightCutoff, t))
        })
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
    arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
    t1: t,
    t2: t,
  ): option<result<SymbolicDistTypes.symbolicDist, string>> =>
    switch (arithmeticOperation, t1, t2) {
    | (arithmeticOperation, Symbolic(d1), Symbolic(d2)) =>
      switch SymbolicDist.T.tryAnalyticalSimplification(d1, d2, arithmeticOperation) {
      | #AnalyticalSolution(symbolicDist) => Some(Ok(symbolicDist))
      | #Error(er) => Some(Error(er))
      | #NoSolution => None
      }
    | _ => None
    }

  let runConvolution = (
    toPointSet: toPointSetFn,
    arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
    t1: t,
    t2: t,
  ) =>
    E.R.merge(toPointSet(t1), toPointSet(t2))->E.R2.fmap(((a, b)) =>
      PointSetDist.combineAlgebraically(arithmeticOperation, a, b)
    )

  let runMonteCarlo = (
    toSampleSet: toSampleSetFn,
    arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
    t1: t,
    t2: t,
  ) => {
    let arithmeticOperation = Operation.Algebraic.toFn(arithmeticOperation)
    E.R.merge(toSampleSet(t1), toSampleSet(t2))->E.R2.fmap(((a, b)) => {
      Belt.Array.zip(a, b)->E.A2.fmap(((a, b)) => arithmeticOperation(a, b))
    })
  }

  //I'm (Ozzie) really just guessing here, very little idea what's best
  let expectedConvolutionCost: t => int = x =>
    switch x {
    | Symbolic(#Float(_)) => 1
    | Symbolic(_) => 1000
    | PointSet(Discrete(m)) => m.xyShape->XYShape.T.length
    | PointSet(Mixed(_)) => 1000
    | PointSet(Continuous(_)) => 1000
    | _ => 1000
    }

  let chooseConvolutionOrMonteCarlo = (t2: t, t1: t) =>
    expectedConvolutionCost(t1) * expectedConvolutionCost(t2) > 10000
      ? #CalculateWithMonteCarlo
      : #CalculateWithConvolution

  let run = (
    t1: t,
    ~toPointSetFn: toPointSetFn,
    ~toSampleSetFn: toSampleSetFn,
    ~arithmeticOperation,
    ~t2: t,
  ): result<t, error> => {
    switch tryAnalyticalSimplification(arithmeticOperation, t1, t2) {
    | Some(Ok(symbolicDist)) => Ok(Symbolic(symbolicDist))
    | Some(Error(e)) => Error(Other(e))
    | None =>
      switch chooseConvolutionOrMonteCarlo(t1, t2) {
      | #CalculateWithMonteCarlo =>
        runMonteCarlo(
          toSampleSetFn,
          arithmeticOperation,
          t1,
          t2,
        )->E.R2.fmap(r => GenericDist_Types.SampleSet(r))
      | #CalculateWithConvolution =>
        runConvolution(
          toPointSetFn,
          arithmeticOperation,
          t1,
          t2,
        )->E.R2.fmap(r => GenericDist_Types.PointSet(r))
      }
    }
  }
}

let algebraicCombination = AlgebraicCombination.run

//TODO: Add faster pointwiseCombine fn
let pointwiseCombination = (
  t1: t,
  ~toPointSetFn: toPointSetFn,
  ~arithmeticOperation,
  ~t2: t,
): result<t, error> => {
  E.R.merge(toPointSetFn(t1), toPointSetFn(t2))
  ->E.R2.fmap(((t1, t2)) =>
    PointSetDist.combinePointwise(
      GenericDist_Types.Operation.arithmeticToFn(arithmeticOperation),
      t1,
      t2,
    )
  )
  ->E.R2.fmap(r => GenericDist_Types.PointSet(r))
}

let pointwiseCombinationFloat = (
  t: t,
  ~toPointSetFn: toPointSetFn,
  ~arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
  ~float: float,
): result<t, error> => {
  let m = switch arithmeticOperation {
  | #Add | #Subtract => Error(GenericDist_Types.DistributionVerticalShiftIsInvalid)
  | (#Multiply | #Divide | #Exponentiate | #Logarithm) as arithmeticOperation =>
    toPointSetFn(t)->E.R2.fmap(t => {
      //TODO: Move to PointSet codebase
      let fn = (secondary, main) => Operation.Scale.toFn(arithmeticOperation, main, secondary)
      let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(arithmeticOperation)
      let integralCacheFn = Operation.Scale.toIntegralCacheFn(arithmeticOperation)
      PointSetDist.T.mapY(
        ~integralSumCacheFn=integralSumCacheFn(float),
        ~integralCacheFn=integralCacheFn(float),
        ~fn=fn(float),
        t,
      )
    })
  }
  m->E.R2.fmap(r => GenericDist_Types.PointSet(r))
}

//Note: The result should always cumulatively sum to 1. This would be good to test.
//Note: If the inputs are not normalized, this will return poor results. The weights probably refer to the post-normalized forms. It would be good to apply a catch to this.
let mixture = (
  values: array<(t, float)>,
  ~scaleMultiplyFn: scaleMultiplyFn,
  ~pointwiseAddFn: pointwiseAddFn,
) => {
  if E.A.length(values) == 0 {
    Error(GenericDist_Types.Other("mixture must have at least 1 element"))
  } else {
    let totalWeight = values->E.A2.fmap(E.Tuple2.second)->E.A.Floats.sum
    let properlyWeightedValues =
      values
      ->E.A2.fmap(((dist, weight)) => scaleMultiplyFn(dist, weight /. totalWeight))
      ->E.A.R.firstErrorOrOpen
    properlyWeightedValues->E.R.bind(values => {
      values
      |> Js.Array.sliceFrom(1)
      |> E.A.fold_left(
        (acc, x) => E.R.bind(acc, acc => pointwiseAddFn(acc, x)),
        Ok(E.A.unsafe_get(values, 0)),
      )
    })
  }
}
