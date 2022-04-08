type functionCallInfo = GenericDist_Types.Operation.genericFunctionCallInfo
type genericDist = GenericDist_Types.genericDist
type error = GenericDist_Types.error

// TODO: It could be great to use a cache for some calculations (basically, do memoization). Also, better analytics/tracking could go a long way.

type env = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType =
  | Dist(genericDist)
  | Float(float)
  | String(string)
  | GenDistError(error)

/*
We're going to add another function to this module later, so first define a
local version, which is not exported.
*/
module OutputLocal = {
  type t = outputType

  let toError = (t: outputType) =>
    switch t {
    | GenDistError(d) => Some(d)
    | _ => None
    }

  let toErrorOrUnreachable = (t: t): error => t->toError->E.O2.default((Unreachable: error))

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

  let toFloat = (t: t) =>
    switch t {
    | Float(d) => Some(d)
    | _ => None
    }

  let toFloatR = (t: t): result<float, error> =>
    switch t {
    | Float(r) => Ok(r)
    | e => Error(toErrorOrUnreachable(e))
    }

  let toString = (t: t) =>
    switch t {
    | String(d) => Some(d)
    | _ => None
    }

  let toStringR = (t: t): result<string, error> =>
    switch t {
    | String(r) => Ok(r)
    | e => Error(toErrorOrUnreachable(e))
    }

  //This is used to catch errors in other switch statements.
  let fromResult = (r: result<t, error>): outputType =>
    switch r {
    | Ok(t) => t
    | Error(e) => GenDistError(e)
    }
}

let rec run = (~env, functionCallInfo: functionCallInfo): outputType => {
  let {sampleCount, xyPointLength} = env

  let reCall = (~env=env, ~functionCallInfo=functionCallInfo, ()) => {
    run(~env, functionCallInfo)
  }

  let toPointSetFn = r => {
    switch reCall(~functionCallInfo=FromDist(ToDist(ToPointSet), r), ()) {
    | Dist(PointSet(p)) => Ok(p)
    | e => Error(OutputLocal.toErrorOrUnreachable(e))
    }
  }

  let toSampleSetFn = r => {
    switch reCall(~functionCallInfo=FromDist(ToDist(ToSampleSet(sampleCount)), r), ()) {
    | Dist(SampleSet(p)) => Ok(p)
    | e => Error(OutputLocal.toErrorOrUnreachable(e))
    }
  }

  let scaleMultiply = (r, weight) =>
    reCall(
      ~functionCallInfo=FromDist(ToDistCombination(Pointwise, #Multiply, #Float(weight)), r),
      (),
    )->OutputLocal.toDistR

  let pointwiseAdd = (r1, r2) =>
    reCall(
      ~functionCallInfo=FromDist(ToDistCombination(Pointwise, #Add, #Dist(r2)), r1),
      (),
    )->OutputLocal.toDistR

  let fromDistFn = (subFnName: GenericDist_Types.Operation.fromDist, dist: genericDist) =>
    switch subFnName {
    | ToFloat(distToFloatOperation) =>
      GenericDist.toFloatOperation(dist, ~toPointSetFn, ~distToFloatOperation)
      ->E.R2.fmap(r => Float(r))
      ->OutputLocal.fromResult
    | ToString(ToString) => dist->GenericDist.toString->String
    | ToString(ToSparkline(buckets)) =>
      GenericDist.toSparkline(dist, ~sampleCount, ~buckets, ())
      ->E.R2.fmap(r => String(r))
      ->OutputLocal.fromResult
    | ToDist(Inspect) => {
        Js.log2("Console log requested: ", dist)
        Dist(dist)
      }
    | ToDist(Normalize) => dist->GenericDist.normalize->Dist
    | ToDist(Truncate(leftCutoff, rightCutoff)) =>
      GenericDist.truncate(~toPointSetFn, ~leftCutoff, ~rightCutoff, dist, ())
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    | ToDist(ToSampleSet(n)) =>
      dist->GenericDist.sampleN(n)->E.R2.fmap(r => Dist(SampleSet(r)))->OutputLocal.fromResult
    | ToDist(ToPointSet) =>
      dist
      ->GenericDist.toPointSet(~xyPointLength, ~sampleCount, ())
      ->E.R2.fmap(r => Dist(PointSet(r)))
      ->OutputLocal.fromResult
    | ToDistCombination(Algebraic, _, #Float(_)) => GenDistError(NotYetImplemented)
    | ToDistCombination(Algebraic, arithmeticOperation, #Dist(t2)) =>
      dist
      ->GenericDist.algebraicCombination(~toPointSetFn, ~toSampleSetFn, ~arithmeticOperation, ~t2)
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    | ToDistCombination(Pointwise, arithmeticOperation, #Dist(t2)) =>
      dist
      ->GenericDist.pointwiseCombination(~toPointSetFn, ~arithmeticOperation, ~t2)
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    | ToDistCombination(Pointwise, arithmeticOperation, #Float(float)) =>
      dist
      ->GenericDist.pointwiseCombinationFloat(~toPointSetFn, ~arithmeticOperation, ~float)
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    }

  switch functionCallInfo {
  | FromDist(subFnName, dist) => fromDistFn(subFnName, dist)
  | FromFloat(subFnName, float) =>
    reCall(~functionCallInfo=FromDist(subFnName, GenericDist.fromFloat(float)), ())
  | Mixture(dists) =>
    dists
    ->GenericDist.mixture(~scaleMultiplyFn=scaleMultiply, ~pointwiseAddFn=pointwiseAdd)
    ->E.R2.fmap(r => Dist(r))
    ->OutputLocal.fromResult
  }
}

let runFromDist = (~env, ~functionCallInfo, dist) => run(~env, FromDist(functionCallInfo, dist))
let runFromFloat = (~env, ~functionCallInfo, float) => run(~env, FromFloat(functionCallInfo, float))

module Output = {
  include OutputLocal

  let fmap = (
    ~env,
    input: outputType,
    functionCallInfo: GenericDist_Types.Operation.singleParamaterFunction,
  ): outputType => {
    let newFnCall: result<functionCallInfo, error> = switch (functionCallInfo, input) {
    | (FromDist(fromDist), Dist(o)) => Ok(FromDist(fromDist, o))
    | (FromFloat(fromDist), Float(o)) => Ok(FromFloat(fromDist, o))
    | (_, GenDistError(r)) => Error(r)
    | (FromDist(_), _) => Error(Other("Expected dist, got something else"))
    | (FromFloat(_), _) => Error(Other("Expected float, got something else"))
    }
    newFnCall->E.R2.fmap(run(~env))->OutputLocal.fromResult
  }
}

module Constructors = {
  module UsingDists = {
    module C = GenericDist_Types.Constructors.UsingDists
    open OutputLocal
    type floatResult= result<float, error>

    let mean = (~env, dist) => run(~env, C.mean(dist))->toFloatR
    let sample = (~env, dist) => run(~env, C.sample(dist))->toFloatR
    let cdf = (~env, dist, f) => run(~env, C.cdf(dist, f))->toFloatR
    let inv = (~env, dist, f) => run(~env, C.inv(dist, f))->toFloatR
    let pdf = (~env, dist, f) => run(~env, C.pdf(dist, f))->toFloatR
    let normalize = (~env, dist) => run(~env, C.normalize(dist))->toDistR
    let toPointSet = (~env, dist) => run(~env, C.toPointSet(dist))->toDistR
    let toSampleSet = (~env, dist, n) => run(~env, C.toSampleSet(dist, n))->toDistR
    let truncate = (~env, dist, leftCutoff, rightCutoff) =>
      run(~env, C.truncate(dist, leftCutoff, rightCutoff))->toDistR
    let inspect = (~env, dist) => run(~env, C.inspect(dist))->toDistR
    let toString = (~env, dist) => run(~env, C.toString(dist))->toStringR
    let toSparkline = (~env, dist, buckets) => run(~env, C.toSparkline(dist, buckets))->toStringR
    let algebraicAdd = (~env, dist1, dist2) => run(~env, C.algebraicAdd(dist1, dist2))->toDistR
    let algebraicMultiply = (~env, dist1, dist2) =>
      run(~env, C.algebraicMultiply(dist1, dist2))->toDistR
    let algebraicDivide = (~env, dist1, dist2) =>
      run(~env, C.algebraicDivide(dist1, dist2))->toDistR
    let algebraicSubtract = (~env, dist1, dist2) =>
      run(~env, C.algebraicSubtract(dist1, dist2))->toDistR
    let algebraicLogarithm = (~env, dist1, dist2) =>
      run(~env, C.algebraicLogarithm(dist1, dist2))->toDistR
    let algebraicExponentiate = (~env, dist1, dist2) =>
      run(~env, C.algebraicExponentiate(dist1, dist2))->toDistR
    let pointwiseAdd = (~env, dist1, dist2) => run(~env, C.pointwiseAdd(dist1, dist2))->toDistR
    let pointwiseMultiply = (~env, dist1, dist2) =>
      run(~env, C.pointwiseMultiply(dist1, dist2))->toDistR
    let pointwiseDivide = (~env, dist1, dist2) =>
      run(~env, C.pointwiseDivide(dist1, dist2))->toDistR
    let pointwiseSubtract = (~env, dist1, dist2) =>
      run(~env, C.pointwiseSubtract(dist1, dist2))->toDistR
    let pointwiseLogarithm = (~env, dist1, dist2) =>
      run(~env, C.pointwiseSubtract(dist1, dist2))->toDistR
    let pointwiseExponentiate = (~env, dist1, dist2) =>
      run(~env, C.pointwiseSubtract(dist1, dist2))->toDistR
  }
}