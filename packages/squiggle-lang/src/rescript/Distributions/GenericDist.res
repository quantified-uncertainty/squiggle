type t = DistributionTypes.genericDist
type error = DistError.t
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<SampleSetDist.t, error>

type env = Env.env

let defaultEnv: Env.env = {
  sampleCount: MagicNumbers.Environment.defaultSampleCount,
  xyPointLength: MagicNumbers.Environment.defaultXYPointLength,
}

let isPointSet = (t: t) =>
  switch t {
  | PointSet(_) => true
  | _ => false
  }

let isSampleSet = (t: t) =>
  switch t {
  | SampleSet(_) => true
  | _ => false
  }

let isSymbolic = (t: t) =>
  switch t {
  | Symbolic(_) => true
  | _ => false
  }

let sampleN = (t: t, n) =>
  switch t {
  | PointSet(r) => PointSetDist.sampleN(n, r)
  | Symbolic(r) => SymbolicDist.T.sampleN(n, r)
  | SampleSet(r) => SampleSetDist.sampleN(r, n)
  }

let sample = (t: t) => {
  switch t {
  | PointSet(r) => PointSetDist.sample(r)
  | Symbolic(r) => SymbolicDist.T.sample(r)
  | SampleSet(r) => SampleSetDist.sample(r)
  }
}

let toSampleSetDist = (t: t, n) => SampleSetDist.make(sampleN(t, n))

let fromFloat = (f: float): t => Symbolic(
  SymbolicDist.Float.make(f)->E.R.toExn("failed to make float"),
)

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

//Todo: If it's a pointSet, but the xyPointLength is different from what it has, it should change.
// This is tricky because the case of discrete distributions.
// Also, change the outputXYPoints/pointSetDistLength details
let toPointSet = (
  t,
  ~env: env,
  ~xSelection: DistributionTypes.DistributionOperation.pointsetXSelection=#ByWeight,
  (),
): result<PointSetTypes.pointSetDist, error> => {
  switch (t: t) {
  | PointSet(pointSet) => Ok(pointSet)
  | Symbolic(r) => SymbolicDist.T.toPointSetDist(~xSelection, ~env, r)
  | SampleSet(r) => SampleSetDist.toPointSetDist(~samples=r, ~env)
  }
}

let mean = (t: t) =>
  switch t {
  | PointSet(r) => PointSetDist.T.mean(r)->Ok
  | Symbolic(r) => SymbolicDist.T.mean(r)->Ok
  | SampleSet(r) => SampleSetDist.mean(r)->Ok
  }
let min = (t: t) =>
  switch t {
  | PointSet(r) => PointSetDist.T.min(r)->Ok
  | Symbolic(r) => SymbolicDist.T.min(r)->Ok
  | SampleSet(r) => SampleSetDist.min(r)->Ok
  }
let max = (t: t) =>
  switch t {
  | PointSet(r) => PointSetDist.T.max(r)->Ok
  | Symbolic(r) => SymbolicDist.T.max(r)->Ok
  | SampleSet(r) => SampleSetDist.max(r)->Ok
  }

let pdf = (t: t, x: float, ~env: env) =>
  switch t {
  | PointSet(r) => PointSetDist.pdf(x, r)
  | Symbolic(r) => SymbolicDist.T.pdf(x, r)
  | SampleSet(r) => SampleSetDist.pdf(r, x, ~env)
  }

let cdf = (t: t, x: float) =>
  switch t {
  | PointSet(r) => PointSetDist.cdf(x, r)
  | Symbolic(r) => SymbolicDist.T.cdf(x, r)
  | SampleSet(r) => SampleSetDist.cdf(r, x)
  }

let inv = (t: t, x: float) =>
  switch t {
  | PointSet(r) => PointSetDist.inv(x, r)
  | Symbolic(r) => SymbolicDist.T.inv(x, r)
  | SampleSet(r) => SampleSetDist.percentile(r, x)
  }

let stdev = (t: t, ~env as _: env) =>
  switch t {
  | SampleSet(s) => SampleSetDist.stdev(s)->Ok
  | _ => Error(DistError.notYetImplemented())
  }
let variance = (t: t, ~env as _: env) =>
  switch t {
  | SampleSet(s) => SampleSetDist.variance(s)->Ok
  | _ => Error(DistError.notYetImplemented())
  }
let mode = (t: t, ~env as _: env) =>
  switch t {
  | SampleSet(s) => SampleSetDist.mode(s)->Ok
  | _ => Error(DistError.notYetImplemented())
  }

module Score = {
  type genericDistOrScalar = Score_Dist(t) | Score_Scalar(float)

  let logScoreDistAnswer = (~estimate: t, ~answer: t, ~prior: option<t>, ~env: env): result<
    float,
    error,
  > => {
    let toPointSetFn = t => toPointSet(t, ~env, ())
    estimate
    ->toPointSetFn
    ->E.R.bind(estimate' => {
      answer
      ->toPointSetFn
      ->E.R.bind(answer' => {
        let prior' = prior->E_O.fmap(toPointSetFn)
        switch prior' {
        | Some(Error(e)) => Error(e)
        | None =>
          PointSetDist.logScoreDistAnswer(
            ~estimate=estimate',
            ~answer=answer',
            ~prior=None,
          )->E.R.errMap(y => DistError.operationError(y))
        | Some(Ok(prior'')) =>
          PointSetDist.logScoreDistAnswer(
            ~estimate=estimate',
            ~answer=answer',
            ~prior=Some(prior''),
          )->E.R.errMap(y => DistError.operationError(y))
        }
      })
    })
  }

  let logScoreScalarAnswer = (~estimate: t, ~answer: float, ~prior: option<t>, ~env: env): result<
    float,
    error,
  > => {
    let toPointSetFn = t => toPointSet(t, ~env, ())
    estimate
    ->toPointSetFn
    ->E.R.bind(estimate' => {
      let prior' = prior->E_O.fmap(toPointSetFn)
      switch prior' {
      | Some(Error(e)) => Error(e)
      | None =>
        PointSetDist.logScoreScalarAnswer(
          ~estimate=estimate',
          ~answer,
          ~prior=None,
        )->E.R.errMap(y => DistError.operationError(y))
      | Some(Ok(prior'')) =>
        PointSetDist.logScoreScalarAnswer(
          ~estimate=estimate',
          ~answer,
          ~prior=Some(prior''),
        )->E.R.errMap(y => DistError.operationError(y))
      }
    })
  }

  let logScore = (~estimate: t, ~answer: genericDistOrScalar, ~prior: option<t>, ~env: env): result<
    float,
    error,
  > => {
    switch answer {
    | Score_Dist(t) => logScoreDistAnswer(~estimate, ~answer=t, ~prior, ~env)
    | Score_Scalar(t) => logScoreScalarAnswer(~estimate, ~answer=t, ~prior, ~env)
    }
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
  ->toPointSet(~xSelection=#Linear, ~env={xyPointLength: bucketCount * 3, sampleCount}, ())
  ->E.R.bind(r =>
    r->PointSetDist.toSparkline(bucketCount)->E.R.errMap(x => DistError.sparklineError(x))
  )

let truncate = (
  t: t,
  ~env: env,
  ~leftCutoff=None: option<float>,
  ~rightCutoff=None: option<float>,
  (),
): result<t, error> => {
  let doesNotNeedCutoff = E.O.isNone(leftCutoff) && E.O.isNone(rightCutoff)
  if doesNotNeedCutoff {
    Ok(t)
  } else {
    switch t {
    | Symbolic(t) => SymbolicDist.T.truncate(leftCutoff, rightCutoff, t, ~env)->E.R.fmap(normalize)
    | SampleSet(t) =>
      SampleSetDist.truncate(
        t,
        ~leftCutoff,
        ~rightCutoff,
      )->E.R.fmap(d => DistributionTypes.SampleSet(d))
    | PointSet(t) =>
      PointSetDist.T.truncate(leftCutoff, rightCutoff, t)
      ->E.R.fmap(PointSetDist.T.normalize)
      ->E.R.fmap(d => DistributionTypes.PointSet(d))
    }
  }
}

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution.
*/
module AlgebraicCombination = {
  module InputValidator = {
    /*
     It would be good to also do a check to make sure that probability mass for the second
     operand, at value 1.0, is 0 (or approximately 0). However, we'd ideally want to check
     that both the probability mass and the probability density are greater than zero.
     Right now we don't yet have a way of getting probability mass, so I'll leave this for later.
 */
    let getLogarithmInputError = (t1: t, t2: t): option<error> => {
      let isDistGreaterThanZero = t => cdf(t, MagicNumbers.Epsilon.ten) > 0.

      switch [isDistGreaterThanZero(t1), isDistGreaterThanZero(t2)] {
      | [true, _] =>
        Some(
          DistError.logarithmOfDistributionError("First input must be completely greater than 0"),
        )
      | [false, true] =>
        Some(
          DistError.logarithmOfDistributionError("Second input must be completely greater than 0"),
        )
      | [false, false] => None
      | _ => Some(DistError.unreachableError())
      }
    }

    let run = (t1: t, t2: t, ~arithmeticOperation): option<error> => {
      if arithmeticOperation == #Logarithm {
        getLogarithmInputError(t1, t2)
      } else {
        None
      }
    }
  }

  module StrategyCallOnValidatedInputs = {
    let convolution = (
      toPointSet: toPointSetFn,
      arithmeticOperation: Operation.convolutionOperation,
      t1: t,
      t2: t,
    ): result<t, error> =>
      E.R.merge(toPointSet(t1), toPointSet(t2))
      ->E.R.fmap(((a, b)) => PointSetDist.combineAlgebraically(arithmeticOperation, a, b))
      ->E.R.fmap(r => DistributionTypes.PointSet(r))

    let monteCarlo = (
      toSampleSet: toSampleSetFn,
      arithmeticOperation: Operation.algebraicOperation,
      t1: t,
      t2: t,
    ): result<t, error> => {
      let fn = Operation.Algebraic.toFn(arithmeticOperation)
      E.R.merge(toSampleSet(t1), toSampleSet(t2))
      ->E.R.bind(((t1, t2)) => {
        SampleSetDist.map2(~fn, ~t1, ~t2)
      })
      ->E.R.fmap(r => DistributionTypes.SampleSet(r))
    }

    let symbolic = (
      arithmeticOperation: Operation.algebraicOperation,
      t1: t,
      t2: t,
    ): SymbolicDistTypes.analyticalSimplificationResult => {
      switch (t1, t2) {
      | (DistributionTypes.Symbolic(d1), DistributionTypes.Symbolic(d2)) =>
        SymbolicDist.T.tryAnalyticalSimplification(d1, d2, arithmeticOperation)
      | _ => None
      }
    }
  }

  module StrategyChooser = {
    type specificStrategy = [#AsSymbolic | #AsMonteCarlo | #AsConvolution]

    //I'm (Ozzie) really just guessing here, very little idea what's best
    let expectedConvolutionCost: t => int = x =>
      switch x {
      | Symbolic(d) => SymbolicDist.T.expectedConvolutionCost(d)
      | PointSet(d) => PointSetDist.expectedConvolutionCost(d)
      | _ => MagicNumbers.OpCost.wildcardCost
      }

    let hasSampleSetDist = (t1: t, t2: t): bool => isSampleSet(t1) || isSampleSet(t2)

    let convolutionIsFasterThanMonteCarlo = (t1: t, t2: t): bool =>
      expectedConvolutionCost(t1) * expectedConvolutionCost(t2) < MagicNumbers.OpCost.monteCarloCost

    let preferConvolutionToMonteCarlo = (t1, t2, arithmeticOperation) => {
      !hasSampleSetDist(t1, t2) &&
      Operation.Convolution.canDoAlgebraicOperation(arithmeticOperation) &&
      convolutionIsFasterThanMonteCarlo(t1, t2)
    }

    let run = (~t1: t, ~t2: t, ~arithmeticOperation): specificStrategy => {
      switch StrategyCallOnValidatedInputs.symbolic(arithmeticOperation, t1, t2) {
      | Some(_) => #AsSymbolic
      | None =>
        preferConvolutionToMonteCarlo(t1, t2, arithmeticOperation) ? #AsConvolution : #AsMonteCarlo
      }
    }
  }

  let runStrategyOnValidatedInputs = (
    ~t1: t,
    ~t2: t,
    ~arithmeticOperation,
    ~strategy: StrategyChooser.specificStrategy,
    ~toPointSetFn: toPointSetFn,
    ~toSampleSetFn: toSampleSetFn,
  ): result<t, error> => {
    switch strategy {
    | #AsMonteCarlo =>
      StrategyCallOnValidatedInputs.monteCarlo(toSampleSetFn, arithmeticOperation, t1, t2)
    | #AsSymbolic =>
      switch StrategyCallOnValidatedInputs.symbolic(arithmeticOperation, t1, t2) {
      | Some(Ok(symbolicDist)) => Ok(Symbolic(symbolicDist))
      | Some(Error(e)) => Error(DistError.operationError(e))
      | None => Error(DistError.unreachableError())
      }
    | #AsConvolution =>
      switch Operation.Convolution.fromAlgebraicOperation(arithmeticOperation) {
      | Some(convOp) => StrategyCallOnValidatedInputs.convolution(toPointSetFn, convOp, t1, t2)
      | None => Error(DistError.unreachableError())
      }
    }
  }

  let run = (
    ~strategy: DistributionTypes.asAlgebraicCombinationStrategy,
    t1: t,
    ~env: env,
    ~arithmeticOperation: Operation.algebraicOperation,
    ~t2: t,
  ): result<t, error> => {
    let toSampleSetFn = dist => dist->toSampleSetDist(env.sampleCount)
    let toPointSetFn = dist => toPointSet(dist, ~env, ())

    let invalidOperationError = InputValidator.run(t1, t2, ~arithmeticOperation)
    switch (invalidOperationError, strategy) {
    | (Some(e), _) => Error(e)
    | (None, AsDefault) => {
        let chooseStrategy = StrategyChooser.run(~arithmeticOperation, ~t1, ~t2)
        runStrategyOnValidatedInputs(
          ~t1,
          ~t2,
          ~strategy=chooseStrategy,
          ~arithmeticOperation,
          ~toPointSetFn,
          ~toSampleSetFn,
        )
      }

    | (None, AsMonteCarlo) =>
      StrategyCallOnValidatedInputs.monteCarlo(toSampleSetFn, arithmeticOperation, t1, t2)
    | (None, AsSymbolic) =>
      switch StrategyCallOnValidatedInputs.symbolic(arithmeticOperation, t1, t2) {
      | Some(Ok(symbolicDist)) => Ok(Symbolic(symbolicDist))
      | None => Error(DistError.requestedStrategyInvalidError(`No analytic solution for inputs`))
      | Some(Error(err)) => Error(DistError.operationError(err))
      }
    | (None, AsConvolution) =>
      switch Operation.Convolution.fromAlgebraicOperation(arithmeticOperation) {
      | None => {
          let errString = `Convolution not supported for ${Operation.Algebraic.toString(
              arithmeticOperation,
            )}`
          Error(DistError.requestedStrategyInvalidError(errString))
        }

      | Some(convOp) => StrategyCallOnValidatedInputs.convolution(toPointSetFn, convOp, t1, t2)
      }
    }
  }
}

let algebraicCombination = AlgebraicCombination.run

//TODO: Add faster pointwiseCombine fn
let pointwiseCombination = (
  t1: t,
  ~env: env,
  ~algebraicCombination: Operation.algebraicOperation,
  ~t2: t,
): result<t, error> => {
  let toPointSetFn = dist => toPointSet(dist, ~env, ())

  E.R.merge(toPointSetFn(t1), toPointSetFn(t2))->E.R.bind(((t1, t2)) =>
    PointSetDist.combinePointwise(Operation.Algebraic.toFn(algebraicCombination), t1, t2)
    ->E.R.fmap(r => DistributionTypes.PointSet(r))
    ->E.R.errMap(err => DistError.operationError(err))
  )
}

let pointwiseCombinationFloat = (
  t: t,
  ~env: env,
  ~algebraicCombination: Operation.algebraicOperation,
  ~f: float,
): result<t, error> => {
  let executeCombination = arithOp =>
    t
    ->toPointSet(~env, ())
    ->E.R.bind(t => {
      //TODO: Move to PointSet codebase
      let fn = (secondary, main) => Operation.Scale.toFn(arithOp, main, secondary)
      let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(arithOp)
      let integralCacheFn = Operation.Scale.toIntegralCacheFn(arithOp)
      PointSetDist.T.mapYResult(
        ~integralSumCacheFn=integralSumCacheFn(f),
        ~integralCacheFn=integralCacheFn(f),
        t,
        fn(f),
      )->E.R.errMap(x => DistError.operationError(x))
    })
  let m = switch algebraicCombination {
  | #Add | #Subtract => Error(DistError.distributionVerticalShiftIsInvalid())
  | (#Multiply | #Divide | #Power | #Logarithm) as arithmeticOperation =>
    executeCombination(arithmeticOperation)
  | #LogarithmWithThreshold(eps) => executeCombination(#LogarithmWithThreshold(eps))
  }
  m->E.R.fmap(r => DistributionTypes.PointSet(r))
}

let scaleLog = (t: t, f: float, ~env: env) =>
  t->pointwiseCombinationFloat(~env, ~algebraicCombination=#Logarithm, ~f)

//TODO: The result should always cumulatively sum to 1. This would be good to test.
//TODO: If the inputs are not normalized, this will return poor results. The weights probably refer to the post-normalized forms. It would be good to apply a catch to this.
let mixture = (values: array<(t, float)>, ~env: env) => {
  let scaleMultiplyFn = (dist, weight) =>
    dist->pointwiseCombinationFloat(~env, ~algebraicCombination=#Multiply, ~f=weight)

  let pointwiseAddFn = (dist1, dist2) =>
    dist1->pointwiseCombination(~env, ~algebraicCombination=#Add, ~t2=dist2)

  let allValuesAreSampleSet = v => E.A.every(v, ((t, _)) => isSampleSet(t))

  if E.A.isEmpty(values) {
    Error(DistError.fromString("Mixture error: mixture must have at least 1 element"))
  } else if allValuesAreSampleSet(values) {
    let withSampleSetValues = values->E.A.fmap(((value, weight)) =>
      switch value {
      | SampleSet(sampleSet) => Ok((sampleSet, weight))
      | _ => Error("Unreachable")
      }->E.R.toExn("Mixture coding error: SampleSet expected. This should be inaccessible.")
    )
    let sampleSetMixture = SampleSetDist.mixture(withSampleSetValues, env.sampleCount)
    switch sampleSetMixture {
    | Ok(sampleSet) => Ok(DistributionTypes.SampleSet(sampleSet))
    | Error(err) => Error(err)
    }
  } else {
    let totalWeight = values->E.A.fmap(E.Tuple2.second)->E.A.Floats.sum
    let properlyWeightedValues =
      values
      ->E.A.fmap(((dist, weight)) => scaleMultiplyFn(dist, weight /. totalWeight))
      ->E.A.R.firstErrorOrOpen
    properlyWeightedValues->E.R.bind(values => {
      values
      ->Belt.Array.sliceToEnd(1)
      ->E.A.reduce(Ok(E.A.unsafe_get(values, 0)), (acc, x) =>
        E.R.bind(acc, acc => pointwiseAddFn(acc, x))
      )
    })
  }
}

module Operations = {
  // common type for all functions below (checked in .resi)
  type operationFn = (~env: env, t, t) => result<t, error>

  // private helpers
  let algebraic = (dist1, dist2, env, operation) =>
    algebraicCombination(
      dist1,
      ~strategy=AsDefault,
      ~arithmeticOperation=operation,
      ~env,
      ~t2=dist2,
    )
  let pointwise = (dist1, dist2, env, operation) =>
    pointwiseCombination(dist1, ~env, ~algebraicCombination=operation, ~t2=dist2)

  let algebraicAdd = (~env, dist1, dist2) => algebraic(dist1, dist2, env, #Add)
  let algebraicMultiply = (~env, dist1, dist2) => algebraic(dist1, dist2, env, #Multiply)
  let algebraicDivide = (~env, dist1, dist2) => algebraic(dist1, dist2, env, #Divide)
  let algebraicSubtract = (~env, dist1, dist2) => algebraic(dist1, dist2, env, #Subtract)
  let algebraicLogarithm = (~env, dist1, dist2) => algebraic(dist1, dist2, env, #Logarithm)
  let algebraicPower = (~env, dist1, dist2) => algebraic(dist1, dist2, env, #Power)

  let pointwiseAdd = (~env, dist1, dist2) => pointwise(dist1, dist2, env, #Add)
  let pointwiseMultiply = (~env, dist1, dist2) => pointwise(dist1, dist2, env, #Multiply)
  let pointwiseDivide = (~env, dist1, dist2) => pointwise(dist1, dist2, env, #Divide)
  let pointwiseSubtract = (~env, dist1, dist2) => pointwise(dist1, dist2, env, #Subtract)
  let pointwiseLogarithm = (~env, dist1, dist2) => pointwise(dist1, dist2, env, #Logarithm)
  let pointwisePower = (~env, dist1, dist2) => pointwise(dist1, dist2, env, #Power)
}
