type operation = GenericDist_Types.Operation.genericFunctionCallInfo
type genericDist = GenericDist_Types.genericDist
type error = GenericDist_Types.error

// TODO: It could be great to use a cache for some calculations (basically, do memoization). Also, better analytics/tracking could go a long way.

type params = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType = [
  | #Dist(genericDist)
  | #Float(float)
  | #String(string)
  | #GenDistError(error)
]

module Output = {
  let toDist = (o: outputType) =>
    switch o {
    | #Dist(d) => Some(d)
    | _ => None
    }

  let toFloat = (o: outputType) =>
    switch o {
    | #Float(d) => Some(d)
    | _ => None
    }

  let toString = (o: outputType) =>
    switch o {
    | #String(d) => Some(d)
    | _ => None
    }

  let toError = (o: outputType) =>
    switch o {
    | #GenDistError(d) => Some(d)
    | _ => None
    }
}

let fromResult = (r: result<outputType, error>): outputType =>
  switch r {
  | Ok(o) => o
  | Error(e) => #GenDistError(e)
  }

let outputToDistResult = (o: outputType): result<genericDist, error> =>
  switch o {
  | #Dist(r) => Ok(r)
  | #GenDistError(r) => Error(r)
  | _ => Error(Unreachable)
  }

let rec run = (extra, fnName: operation): outputType => {
  let {sampleCount, xyPointLength} = extra

  let reCall = (~extra=extra, ~fnName=fnName, ()) => {
    run(extra, fnName)
  }

  let toPointSet = r => {
    switch reCall(~fnName=#fromDist(#toDist(#toPointSet), r), ()) {
    | #Dist(#PointSet(p)) => Ok(p)
    | #GenDistError(r) => Error(r)
    | _ => Error(Unreachable)
    }
  }

  let toSampleSet = r => {
    switch reCall(~fnName=#fromDist(#toDist(#toSampleSet(sampleCount)), r), ()) {
    | #Dist(#SampleSet(p)) => Ok(p)
    | #GenDistError(r) => Error(r)
    | _ => Error(Unreachable)
    }
  }

  let scaleMultiply = (r, weight) =>
    reCall(
      ~fnName=#fromDist(#toDistCombination(#Pointwise, #Multiply, #Float(weight)), r),
      (),
    )->outputToDistResult

  let pointwiseAdd = (r1, r2) =>
    reCall(
      ~fnName=#fromDist(#toDistCombination(#Pointwise, #Add, #Dist(r2)), r1),
      (),
    )->outputToDistResult

  let fromDistFn = (subFnName: GenericDist_Types.Operation.fromDist, dist: genericDist) =>
    switch subFnName {
    | #toFloat(fnName) =>
      GenericDist.operationToFloat(dist, toPointSet, fnName)->E.R2.fmap(r => #Float(r))->fromResult
    | #toString => dist->GenericDist.toString->(r => #String(r))
    | #toDist(#consoleLog) => {
        Js.log2("Console log requested: ", dist)
        #Dist(dist)
      }
    | #toDist(#normalize) => dist->GenericDist.normalize->(r => #Dist(r))
    | #toDist(#truncate(left, right)) =>
      dist->GenericDist.truncate(toPointSet, left, right)->E.R2.fmap(r => #Dist(r))->fromResult
    | #toDist(#toPointSet) =>
      dist->GenericDist.toPointSet(xyPointLength)->E.R2.fmap(r => #Dist(#PointSet(r)))->fromResult
    | #toDist(#toSampleSet(n)) =>
      dist->GenericDist.sampleN(n)->E.R2.fmap(r => #Dist(#SampleSet(r)))->fromResult
    | #toDistCombination(#Algebraic, _, #Float(_)) => #GenDistError(NotYetImplemented)
    | #toDistCombination(#Algebraic, operation, #Dist(dist2)) =>
      dist
      ->GenericDist.algebraicCombination(toPointSet, toSampleSet, operation, dist2)
      ->E.R2.fmap(r => #Dist(r))
      ->fromResult
    | #toDistCombination(#Pointwise, operation, #Dist(dist2)) =>
      dist
      ->GenericDist.pointwiseCombination(toPointSet, operation, dist2)
      ->E.R2.fmap(r => #Dist(r))
      ->fromResult
    | #toDistCombination(#Pointwise, operation, #Float(f)) =>
      dist
      ->GenericDist.pointwiseCombinationFloat(toPointSet, operation, f)
      ->E.R2.fmap(r => #Dist(r))
      ->fromResult
    }

  switch fnName {
  | #fromDist(subFnName, dist) => fromDistFn(subFnName, dist)
  | #fromFloat(subFnName, float) => reCall(~fnName=#fromDist(subFnName, GenericDist.fromFloat(float)), ())
  | #mixture(dists) =>
    dists->GenericDist.mixture(scaleMultiply, pointwiseAdd)->E.R2.fmap(r => #Dist(r))->fromResult
  }
}

let runFromDist = (extra, fnName, dist) => run(extra, #fromDist(fnName, dist))
let runFromFloat = (extra, fnName, float) => run(extra, #fromFloat(fnName, float))

let outputMap = (
  extra,
  input: outputType,
  fn: GenericDist_Types.Operation.singleParamaterFunction,
): outputType => {
  let newFnCall: result<operation, error> = switch (fn, input) {
  | (#fromDist(fromDist), #Dist(o)) => Ok(#fromDist(fromDist, o))
  | (#fromFloat(fromDist), #Float(o)) => Ok(#fromFloat(fromDist, o))
  | (_, #GenDistError(r)) => Error(r)
  | (#fromDist(_), _) => Error(Other("Expected dist, got something else"))
  | (#fromFloat(_), _) => Error(Other("Expected float, got something else"))
  }
  newFnCall->E.R2.fmap(r => run(extra, r))->fromResult
}