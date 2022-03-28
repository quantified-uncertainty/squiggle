type operation = GenericDist_Types.Operation.genericFunctionCall
type genericDist = GenericDist_Types.genericDist
type error = GenericDist_Types.error

// TODO: It could be great to use a cache for some calculations (basically, do memoization). Also, better analytics/tracking could go a long way.

type params = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType = [
  | #Dist(genericDist)
  | #Error(error)
  | #Float(float)
  | #String(string)
]

let fromResult = (r: result<outputType, error>): outputType =>
  switch r {
  | Ok(o) => o
  | Error(e) => #Error(e)
  }

let outputToDistResult = (b: outputType): result<genericDist, error> =>
  switch b {
  | #Dist(r) => Ok(r)
  | #Error(r) => Error(r)
  | _ => Error(ImpossiblePath)
  }

let rec run = (extra, fnName: operation): outputType => {
  let {sampleCount, xyPointLength} = extra

  let reCall = (~extra=extra, ~fnName=fnName, ()) => {
    run(extra, fnName)
  }

  let toPointSet = r => {
    switch reCall(~fnName=#fromDist(#toDist(#toPointSet), r), ()) {
    | #Dist(#PointSet(p)) => Ok(p)
    | #Error(r) => Error(r)
    | _ => Error(ImpossiblePath)
    }
  }

  let toSampleSet = r => {
    switch reCall(~fnName=#fromDist(#toDist(#toSampleSet(sampleCount)), r), ()) {
    | #Dist(#SampleSet(p)) => Ok(p)
    | #Error(r) => Error(r)
    | _ => Error(ImpossiblePath)
    }
  }

  let scaleMultiply = (r, weight) =>
    reCall(
      ~fnName=#fromDist(#toDistCombination(#Pointwise, #Multiply, #Float(weight)), r),
      (),
    ) |> outputToDistResult

  let pointwiseAdd = (r1, r2) =>
    reCall(
      ~fnName=#fromDist(#toDistCombination(#Pointwise, #Add, #Dist(r2)), r1),
      (),
    ) |> outputToDistResult

  let fromDistFn = (subFn: GenericDist_Types.Operation.fromDist, dist: genericDist) =>
    switch subFn {
    | #toFloat(fnName) =>
      GenericDist.operationToFloat(toPointSet, fnName, dist)
      |> E.R.fmap(r => #Float(r))
      |> fromResult
    | #toString => dist |> GenericDist.toString |> (r => #String(r))
    | #toDist(#normalize) => dist |> GenericDist.normalize |> (r => #Dist(r))
    | #toDist(#truncate(left, right)) =>
      dist
      |> GenericDist.truncate(toPointSet, left, right)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    | #toDist(#toPointSet) =>
      dist
      |> GenericDist.toPointSet(xyPointLength)
      |> E.R.fmap(r => #Dist(#PointSet(r)))
      |> fromResult
    | #toDist(#toSampleSet(n)) =>
      dist |> GenericDist.sampleN(n) |> E.R.fmap(r => #Dist(#SampleSet(r))) |> fromResult
    | #toDistCombination(#Algebraic, _, #Float(_)) => #Error(NotYetImplemented)
    | #toDistCombination(#Algebraic, operation, #Dist(dist2)) =>
      dist
      |> GenericDist.algebraicCombination(toPointSet, toSampleSet, operation, dist2)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    | #toDistCombination(#Pointwise, operation, #Dist(dist2)) =>
      dist
      |> GenericDist.pointwiseCombination(toPointSet, operation, dist2)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    | #toDistCombination(#Pointwise, operation, #Float(f)) =>
      dist
      |> GenericDist.pointwiseCombinationFloat(toPointSet, operation, f)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    }

  switch fnName {
  | #fromDist(subFn, dist) => fromDistFn(subFn, dist)
  | #fromFloat(subFn, float) => reCall(~fnName=#fromDist(subFn, GenericDist.fromFloat(float)), ())
  | #mixture(dists) =>
    GenericDist.mixture(scaleMultiply, pointwiseAdd, dists) |> E.R.fmap(r => #Dist(r)) |> fromResult
  }
}
