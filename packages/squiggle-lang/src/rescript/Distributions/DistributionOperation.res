type genericDist = DistributionTypes.genericDist
type error = DistributionTypes.error

// TODO: It could be great to use a cache for some calculations (basically, do memoization). Also, better analytics/tracking could go a long way.

type env = GenericDist.env

let defaultEnv: env = {
  sampleCount: MagicNumbers.Environment.defaultSampleCount,
  xyPointLength: MagicNumbers.Environment.defaultXYPointLength,
}

type outputType =
  | Dist(genericDist)
  | Float(float)
  | String(string)
  | FloatArray(array<float>)
  | Bool(bool)
  | GenDistError(error)

module Output = {
  type t = outputType

  let toError = (t: outputType) =>
    switch t {
    | GenDistError(d) => Some(d)
    | _ => None
    }

  let toErrorOrUnreachable = (t: t): error => t->toError->E.O.default((Unreachable: error))

  let toDistR = (t: t): result<genericDist, error> =>
    switch t {
    | Dist(r) => Ok(r)
    | e => Error(toErrorOrUnreachable(e))
    }

  let toDist = (t: t) =>
    switch t {
    | Dist(d) => Some(d)
    | _ => None
    }

  //This is used to catch errors in other switch statements.
  let fromResult = (r: result<t, error>): outputType =>
    switch r {
    | Ok(t) => t
    | Error(e) => GenDistError(e)
    }
}

let run = (
  ~env: env,
  operation: DistributionTypes.DistributionOperation.t,
  dist: genericDist,
): outputType => {
  let {sampleCount} = env

  let toPointSetFn = dist => dist->GenericDist.toPointSet(~env, ())

  let toSampleSetFn = dist => dist->GenericDist.toSampleSetDist(sampleCount)

  switch operation {
  | #ToDist(Inspect) => {
      Js.log2("Console log requested: ", dist)
      Dist(dist)
    }

  | #ToDist(Normalize) => dist->GenericDist.normalize->Dist
  | #ToDist(Truncate(leftCutoff, rightCutoff)) =>
    GenericDist.truncate(~toPointSetFn, ~leftCutoff, ~rightCutoff, dist, ())
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  | #ToDist(ToSampleSet(n)) =>
    dist->GenericDist.toSampleSetDist(n)->E.R.fmap(r => Dist(SampleSet(r)))->Output.fromResult
  | #ToDist(ToPointSet) =>
    dist->GenericDist.toPointSet(~env, ())->E.R.fmap(r => Dist(PointSet(r)))->Output.fromResult
  | #ToDist(Scale(#LogarithmWithThreshold(eps), f)) =>
    dist
    ->GenericDist.pointwiseCombinationFloat(
      ~toPointSetFn,
      ~algebraicCombination=#LogarithmWithThreshold(eps),
      ~f,
    )
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  | #ToDist(Scale(#Multiply, f)) =>
    dist
    ->GenericDist.pointwiseCombinationFloat(~toPointSetFn, ~algebraicCombination=#Multiply, ~f)
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  | #ToDist(Scale(#Logarithm, f)) =>
    dist
    ->GenericDist.pointwiseCombinationFloat(~toPointSetFn, ~algebraicCombination=#Logarithm, ~f)
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  | #ToDist(Scale(#Power, f)) =>
    dist
    ->GenericDist.pointwiseCombinationFloat(~toPointSetFn, ~algebraicCombination=#Power, ~f)
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  | #ToDistCombination(Algebraic(strategy), arithmeticOperation, t2) =>
    dist
    ->GenericDist.algebraicCombination(~strategy, ~env, ~toSampleSetFn, ~arithmeticOperation, ~t2)
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  | #ToDistCombination(Pointwise, algebraicCombination, t2) =>
    dist
    ->GenericDist.pointwiseCombination(~toPointSetFn, ~algebraicCombination, ~t2)
    ->E.R.fmap(r => Dist(r))
    ->Output.fromResult
  }
}

// See comment above DistributionTypes.Constructors to explain the purpose of this module.
// I tried having another internal module called UsingDists, similar to how its done in
// DistributionTypes.Constructors. However, this broke GenType for me, so beware.
module Constructors = {
  module C = DistributionTypes.Constructors.UsingDists
  open Output
  let normalize = (~env, dist) => run(~env, C.normalize, dist)->toDistR
  let toPointSet = (~env, dist) => run(~env, C.toPointSet, dist)->toDistR
  let toSampleSet = (~env, dist, n) => run(~env, C.toSampleSet(n), dist)->toDistR
  let truncate = (~env, dist, leftCutoff, rightCutoff) =>
    run(~env, C.truncate(leftCutoff, rightCutoff), dist)->toDistR
  let inspect = (~env, dist) => run(~env, C.inspect, dist)->toDistR
  let algebraicAdd = (~env, dist1, dist2) => run(~env, C.algebraicAdd(dist2), dist1)->toDistR
  let algebraicMultiply = (~env, dist1, dist2) =>
    run(~env, C.algebraicMultiply(dist2), dist1)->toDistR
  let algebraicDivide = (~env, dist1, dist2) => run(~env, C.algebraicDivide(dist2), dist1)->toDistR
  let algebraicSubtract = (~env, dist1, dist2) =>
    run(~env, C.algebraicSubtract(dist2), dist1)->toDistR
  let algebraicLogarithm = (~env, dist1, dist2) =>
    run(~env, C.algebraicLogarithm(dist2), dist1)->toDistR
  let algebraicPower = (~env, dist1, dist2) => run(~env, C.algebraicPower(dist2), dist1)->toDistR
  let scaleMultiply = (~env, dist, n) => run(~env, C.scaleMultiply(n), dist)->toDistR
  let scalePower = (~env, dist, n) => run(~env, C.scalePower(n), dist)->toDistR
  let scaleLogarithm = (~env, dist, n) => run(~env, C.scaleLogarithm(n), dist)->toDistR
  let pointwiseAdd = (~env, dist1, dist2) => run(~env, C.pointwiseAdd(dist2), dist1)->toDistR
  let pointwiseMultiply = (~env, dist1, dist2) =>
    run(~env, C.pointwiseMultiply(dist2), dist1)->toDistR
  let pointwiseDivide = (~env, dist1, dist2) => run(~env, C.pointwiseDivide(dist2), dist1)->toDistR
  let pointwiseSubtract = (~env, dist1, dist2) =>
    run(~env, C.pointwiseSubtract(dist2), dist1)->toDistR
  let pointwiseLogarithm = (~env, dist1, dist2) =>
    run(~env, C.pointwiseLogarithm(dist2), dist1)->toDistR
  let pointwisePower = (~env, dist1, dist2) => run(~env, C.pointwisePower(dist2), dist1)->toDistR
}
