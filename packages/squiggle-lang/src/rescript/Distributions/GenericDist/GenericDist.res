//TODO: multimodal, add interface, test somehow, track performance, refactor sampleSet, refactor ASTEvaluator.res.
type t = DistributionTypes.genericDist
type error = DistributionTypes.error
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<SampleSetDist.t, error>
type scaleMultiplyFn = (t, float) => result<t, error>
type pointwiseAddFn = (t, t) => result<t, error>

let sampleN = (t: t, n) =>
  switch t {
  | PointSet(r) => PointSetDist.sampleNRendered(n, r)
  | Symbolic(r) => SymbolicDist.T.sampleN(n, r)
  | SampleSet(r) => SampleSetDist.sampleN(r, n)
  }

let toSampleSetDist = (t: t, n) =>
  SampleSetDist.make(sampleN(t, n))->E.R2.errMap(DistributionTypes.Error.sampleErrorToDistErr)

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

let integralEndY = (t: t): float =>
  switch t {
  | PointSet(r) => PointSetDist.T.integralEndY(r)
  | Symbolic(_) => 1.0
  | SampleSet(_) => 1.0
  }

let isNormalized = (t: t): bool => Js.Math.abs_float(integralEndY(t) -. 1.0) < 1e-7

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
  ~xSelection: DistributionTypes.DistributionOperation.pointsetXSelection=#ByWeight,
  (),
): result<PointSetTypes.pointSetDist, error> => {
  switch (t: t) {
  | PointSet(pointSet) => Ok(pointSet)
  | Symbolic(r) => Ok(SymbolicDist.T.toPointSetDist(~xSelection, xyPointLength, r))
  | SampleSet(r) =>
    SampleSetDist.toPointSetDist(
      ~samples=r,
      ~samplingInputs={
        sampleCount: sampleCount,
        outputXYPoints: xyPointLength,
        pointSetDistLength: xyPointLength,
        kernelWidth: None,
      },
    )->E.R2.errMap(x => DistributionTypes.PointSetConversionError(x))
  }
}

/*
  PointSetDist.toSparkline calls "downsampleEquallyOverX", which downsamples it to n=bucketCount.
  It first needs a pointSetDist, so we convert to a pointSetDist. In this process we want the 
  xyPointLength to be a bit longer than the eventual toSparkline downsampling. I chose 3 
  fairly arbitrarily.
 */
let toSparkline = (t: t, ~sampleCount: int, ~bucketCount: int=20, ()): result<string, error> =>
  t
  ->toPointSet(~xSelection=#Linear, ~xyPointLength=bucketCount * 3, ~sampleCount, ())
  ->E.R.bind(r =>
    r->PointSetDist.toSparkline(bucketCount)->E.R2.errMap(x => DistributionTypes.SparklineError(x))
  )

module Truncate = {
  let trySymbolicSimplification = (
    leftCutoff: option<float>,
    rightCutoff: option<float>,
    t: t,
  ): option<t> =>
    switch (leftCutoff, rightCutoff, t) {
    | (None, None, _) => None
    | (Some(lc), Some(rc), Symbolic(#Uniform(u))) if lc < rc =>
      Some(Symbolic(#Uniform(SymbolicDist.Uniform.truncate(Some(lc), Some(rc), u))))
    | (lc, rc, Symbolic(#Uniform(u))) =>
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
          DistributionTypes.PointSet(PointSetDist.T.truncate(leftCutoff, rightCutoff, t))
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
    arithmeticOperation: Operation.algebraicOperation,
    t1: t,
    t2: t,
  ): option<result<SymbolicDistTypes.symbolicDist, Operation.Error.t>> =>
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
    arithmeticOperation: Operation.convolutionOperation,
    t1: t,
    t2: t,
  ) =>
    E.R.merge(toPointSet(t1), toPointSet(t2))->E.R2.fmap(((a, b)) =>
      PointSetDist.combineAlgebraically(arithmeticOperation, a, b)
    )

  let runMonteCarlo = (
    toSampleSet: toSampleSetFn,
    arithmeticOperation: Operation.algebraicOperation,
    t1: t,
    t2: t,
  ): result<t, error> => {
    let fn = Operation.Algebraic.toFn(arithmeticOperation)
    E.R.merge(toSampleSet(t1), toSampleSet(t2))
    ->E.R.bind(((t1, t2)) => {
      SampleSetDist.map2(~fn, ~t1, ~t2)->E.R2.errMap(x => DistributionTypes.OperationError(x))
    })
    ->E.R2.fmap(r => DistributionTypes.SampleSet(r))
  }

  /*
     It would be good to also do a check to make sure that probability mass for the second
     operand, at value 1.0, is 0 (or approximately 0). However, we'd ideally want to check 
     that both the probability mass and the probability density are greater than zero.
     Right now we don't yet have a way of getting probability mass, so I'll leave this for later.
 */
  let getLogarithmInputError = (t1: t, t2: t, ~toPointSetFn: toPointSetFn): option<error> => {
    let firstOperandIsGreaterThanZero =
      toFloatOperation(t1, ~toPointSetFn, ~distToFloatOperation=#Cdf(1e-10)) |> E.R.fmap(r =>
        r > 0.
      )
    let secondOperandIsGreaterThanZero =
      toFloatOperation(t2, ~toPointSetFn, ~distToFloatOperation=#Cdf(1e-10)) |> E.R.fmap(r =>
        r > 0.
      )
    let items = E.A.R.firstErrorOrOpen([
      firstOperandIsGreaterThanZero,
      secondOperandIsGreaterThanZero,
    ])
    switch items {
    | Error(r) => Some(r)
    | Ok([true, _]) =>
      Some(LogarithmOfDistributionError("First input must completely greater than 0"))
    | Ok([false, true]) =>
      Some(LogarithmOfDistributionError("Second input must completely greater than 0"))
    | Ok([false, false]) => None
    | Ok(_) => Some(Unreachable)
    }
  }

  let getInvalidOperationError = (
    t1: t,
    t2: t,
    ~toPointSetFn: toPointSetFn,
    ~arithmeticOperation,
  ): option<error> => {
    if arithmeticOperation == #Logarithm {
      getLogarithmInputError(t1, t2, ~toPointSetFn)
    } else {
      None
    }
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

  type calculationMethod = MonteCarlo | Convolution(Operation.convolutionOperation)

  let chooseConvolutionOrMonteCarloDefault = (
    op: Operation.algebraicOperation,
    t2: t,
    t1: t,
  ): calculationMethod =>
    switch op {
    | #Divide
    | #Power
    | #Logarithm =>
      MonteCarlo
    | (#Add | #Subtract | #Multiply) as convOp =>
      expectedConvolutionCost(t1) * expectedConvolutionCost(t2) > 10000
        ? MonteCarlo
        : Convolution(convOp)
    }

  let chooseConvolutionOrMonteCarlo = (
    ~strat: DistributionTypes.asAlgebraicCombinationStrategy,
    op: Operation.algebraicOperation,
    t2: t,
    t1: t,
  ): result<calculationMethod, error> => {
    switch strat {
    | AsDefault => Ok(chooseConvolutionOrMonteCarloDefault(op, t2, t1))
    | AsConvolution =>
      switch op {
      | #Divide | #Power | #Logarithm => Error(RequestedStrategyInvalidError)
      | (#Add | #Subtract | #Multiply) as convOp => Ok(Convolution(convOp))
      }
    | AsMontecarlo => Ok(MonteCarlo)
    | AsSymbolic => Error(RequestedStrategyInvalidError)
    }
  }

  let run = (
    ~strategy: DistributionTypes.asAlgebraicCombinationStrategy,
    t1: t,
    ~toPointSetFn: toPointSetFn,
    ~toSampleSetFn: toSampleSetFn,
    ~arithmeticOperation,
    ~t2: t,
  ): result<t, error> => {
    switch tryAnalyticalSimplification(arithmeticOperation, t1, t2) {
    | Some(Ok(symbolicDist)) => Ok(Symbolic(symbolicDist))
    | Some(Error(e)) => Error(OperationError(e))
    | None =>
      switch getInvalidOperationError(t1, t2, ~toPointSetFn, ~arithmeticOperation) {
      | Some(e) => Error(e)
      | None =>
        switch chooseConvolutionOrMonteCarlo(~strat=strategy, arithmeticOperation, t1, t2) {
        | Ok(MonteCarlo) => runMonteCarlo(toSampleSetFn, arithmeticOperation, t1, t2)
        | Ok(Convolution(convOp)) =>
          runConvolution(toPointSetFn, convOp, t1, t2)->E.R2.fmap(r => DistributionTypes.PointSet(
            r,
          ))
        | Error(RequestedStrategyInvalidError) => Error(RequestedStrategyInvalidError)
        | Error(err) => Error(err)
        }
      }
    }
  }
}

let algebraicCombination = AlgebraicCombination.run

//TODO: Add faster pointwiseCombine fn
let pointwiseCombination = (
  t1: t,
  ~toPointSetFn: toPointSetFn,
  ~algebraicCombination: Operation.algebraicOperation,
  ~t2: t,
): result<t, error> => {
  E.R.merge(toPointSetFn(t1), toPointSetFn(t2))->E.R.bind(((t1, t2)) =>
    PointSetDist.combinePointwise(Operation.Algebraic.toFn(algebraicCombination), t1, t2)
    ->E.R2.fmap(r => DistributionTypes.PointSet(r))
    ->E.R2.errMap(err => DistributionTypes.OperationError(err))
  )
}

let pointwiseCombinationFloat = (
  t: t,
  ~toPointSetFn: toPointSetFn,
  ~algebraicCombination: Operation.algebraicOperation,
  ~f: float,
): result<t, error> => {
  let m = switch algebraicCombination {
  | #Add | #Subtract => Error(DistributionTypes.DistributionVerticalShiftIsInvalid)
  | (#Multiply | #Divide | #Power | #Logarithm) as arithmeticOperation =>
    toPointSetFn(t)->E.R.bind(t => {
      //TODO: Move to PointSet codebase
      let fn = (secondary, main) => Operation.Scale.toFn(arithmeticOperation, main, secondary)
      let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(arithmeticOperation)
      let integralCacheFn = Operation.Scale.toIntegralCacheFn(arithmeticOperation)
      PointSetDist.T.mapYResult(
        ~integralSumCacheFn=integralSumCacheFn(f),
        ~integralCacheFn=integralCacheFn(f),
        ~fn=fn(f),
        t,
      )->E.R2.errMap(x => DistributionTypes.OperationError(x))
    })
  }
  m->E.R2.fmap(r => DistributionTypes.PointSet(r))
}

//Note: The result should always cumulatively sum to 1. This would be good to test.
//Note: If the inputs are not normalized, this will return poor results. The weights probably refer to the post-normalized forms. It would be good to apply a catch to this.
let mixture = (
  values: array<(t, float)>,
  ~scaleMultiplyFn: scaleMultiplyFn,
  ~pointwiseAddFn: pointwiseAddFn,
) => {
  if E.A.length(values) == 0 {
    Error(DistributionTypes.OtherError("Mixture error: mixture must have at least 1 element"))
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
