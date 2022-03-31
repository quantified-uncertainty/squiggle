type functionCallInfo = GenericDist_Types.Operation.genericFunctionCallInfo
type genericDist = GenericDist_Types.genericDist
type error = GenericDist_Types.error

// TODO: It could be great to use a cache for some calculations (basically, do memoization). Also, better analytics/tracking could go a long way.

type env = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType =
  | Dist(GenericDist_Types.genericDist)
  | Float(float)
  | String(string)
  | GenDistError(GenericDist_Types.error)

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

  let toString = (t: t) =>
    switch t {
    | String(d) => Some(d)
    | _ => None
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
    switch reCall(~functionCallInfo=#fromDist(#toDist(#toPointSet), r), ()) {
    | Dist(#PointSet(p)) => Ok(p)
    | e => Error(OutputLocal.toErrorOrUnreachable(e))
    }
  }

  let toSampleSetFn = r => {
    switch reCall(~functionCallInfo=#fromDist(#toDist(#toSampleSet(sampleCount)), r), ()) {
    | Dist(#SampleSet(p)) => Ok(p)
    | e => Error(OutputLocal.toErrorOrUnreachable(e))
    }
  }

  let scaleMultiply = (r, weight) =>
    reCall(
      ~functionCallInfo=#fromDist(#toDistCombination(#Pointwise, #Multiply, #Float(weight)), r),
      (),
    )->OutputLocal.toDistR

  let pointwiseAdd = (r1, r2) =>
    reCall(
      ~functionCallInfo=#fromDist(#toDistCombination(#Pointwise, #Add, #Dist(r2)), r1),
      (),
    )->OutputLocal.toDistR

  let fromDistFn = (subFnName: GenericDist_Types.Operation.fromDist, dist: genericDist) =>
    switch subFnName {
    | #toFloat(distToFloatOperation) =>
      GenericDist.toFloatOperation(dist, ~toPointSetFn, ~distToFloatOperation)
      ->E.R2.fmap(r => Float(r))
      ->OutputLocal.fromResult
    | #toString => dist->GenericDist.toString->String
    | #toDist(#inspect) => {
        Js.log2("Console log requested: ", dist)
        Dist(dist)
      }
    | #toDist(#normalize) => dist->GenericDist.normalize->Dist
    | #toDist(#truncate(leftCutoff, rightCutoff)) =>
      GenericDist.truncate(~toPointSetFn, ~leftCutoff, ~rightCutoff, dist, ())
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    | #toDist(#toPointSet) =>
      dist
      ->GenericDist.toPointSet(~xyPointLength, ~sampleCount)
      ->E.R2.fmap(r => Dist(#PointSet(r)))
      ->OutputLocal.fromResult
    | #toDist(#toSampleSet(n)) =>
      dist->GenericDist.sampleN(n)->E.R2.fmap(r => Dist(#SampleSet(r)))->OutputLocal.fromResult
    | #toDistCombination(#Algebraic, _, #Float(_)) => GenDistError(NotYetImplemented)
    | #toDistCombination(#Algebraic, arithmeticOperation, #Dist(t2)) =>
      dist
      ->GenericDist.algebraicCombination(~toPointSetFn, ~toSampleSetFn, ~arithmeticOperation, ~t2)
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    | #toDistCombination(#Pointwise, arithmeticOperation, #Dist(t2)) =>
      dist
      ->GenericDist.pointwiseCombination(~toPointSetFn, ~arithmeticOperation, ~t2)
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    | #toDistCombination(#Pointwise, arithmeticOperation, #Float(float)) =>
      dist
      ->GenericDist.pointwiseCombinationFloat(~toPointSetFn, ~arithmeticOperation, ~float)
      ->E.R2.fmap(r => Dist(r))
      ->OutputLocal.fromResult
    }

  switch functionCallInfo {
  | #fromDist(subFnName, dist) => fromDistFn(subFnName, dist)
  | #fromFloat(subFnName, float) =>
    reCall(~functionCallInfo=#fromDist(subFnName, GenericDist.fromFloat(float)), ())
  | #mixture(dists) =>
    dists
    ->GenericDist.mixture(~scaleMultiplyFn=scaleMultiply, ~pointwiseAddFn=pointwiseAdd)
    ->E.R2.fmap(r => Dist(r))
    ->OutputLocal.fromResult
  }
}

let runFromDist = (~env, ~functionCallInfo, dist) => run(~env, #fromDist(functionCallInfo, dist))
let runFromFloat = (~env, ~functionCallInfo, float) =>
  run(~env, #fromFloat(functionCallInfo, float))

module Output = {
  include OutputLocal

  let fmap = (
    ~env,
    input: outputType,
    functionCallInfo: GenericDist_Types.Operation.singleParamaterFunction,
  ): outputType => {
    let newFnCall: result<functionCallInfo, error> = switch (functionCallInfo, input) {
    | (#fromDist(fromDist), Dist(o)) => Ok(#fromDist(fromDist, o))
    | (#fromFloat(fromDist), Float(o)) => Ok(#fromFloat(fromDist, o))
    | (_, GenDistError(r)) => Error(r)
    | (#fromDist(_), _) => Error(Other("Expected dist, got something else"))
    | (#fromFloat(_), _) => Error(Other("Expected float, got something else"))
    }
    newFnCall->E.R2.fmap(run(~env))->OutputLocal.fromResult
  }
}
