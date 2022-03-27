type operation = GenericDist_Types.Operation.t
type genericDist = GenericDist_Types.genericDist;
type error = GenericDist_Types.error;

type params = {
  sampleCount: int,
  xyPointLength: int,
}

let genericParams = {
  sampleCount: 1000,
  xyPointLength: 1000,
}

type wrapped = (genericDist, params)

let wrapWithParams = (g: genericDist, f: params): wrapped => (g, f)
type outputType = [
  | #Dist(genericDist)
  | #Error(error)
  | #Float(float)
]

let fromResult = (r: result<outputType, error>): outputType =>
  switch r {
  | Ok(o) => o
  | Error(e) => #Error(e)
  }

let rec run = (wrapped: wrapped, fnName: operation): outputType => {
  let (value, {sampleCount, xyPointLength} as extra) = wrapped
  let reCall = (~value=value, ~extra=extra, ~fnName=fnName, ()) => {
    run((value, extra), fnName)
  }
  let toPointSet = r => {
    switch reCall(~value=r, ~fnName=#toDist(#toPointSet), ()) {
    | #Dist(#PointSet(p)) => Ok(p)
    | #Error(r) => Error(r)
    | _ => Error(ImpossiblePath)
    }
  }
  let toSampleSet = r => {
    switch reCall(~value=r, ~fnName=#toDist(#toSampleSet(sampleCount)), ()) {
    | #Dist(#SampleSet(p)) => Ok(p)
    | #Error(r) => Error(r)
    | _ => Error(ImpossiblePath)
    }
  }
  switch fnName {
  | #toFloat(fnName) =>
    GenericDist.operationToFloat(toPointSet, fnName, value) |> E.R.fmap(r => #Float(r)) |> fromResult
  | #toString =>
    #Error(GenericDist_Types.NotYetImplemented)
  | #toDist(#normalize) => value |> GenericDist.normalize |> (r => #Dist(r))
  | #toDist(#truncate(left, right)) =>
    value |> GenericDist.Truncate.run(toPointSet, left, right) |> E.R.fmap(r => #Dist(r)) |> fromResult
  | #toDist(#toPointSet) =>
    value |> GenericDist.toPointSet(xyPointLength) |> E.R.fmap(r => #Dist(#PointSet(r))) |> fromResult
  | #toDist(#toSampleSet(n)) =>
    value |> GenericDist.sampleN(n) |> E.R.fmap(r => #Dist(#SampleSet(r))) |> fromResult
  | #toDistCombination(#Algebraic, _, #Float(_)) => #Error(NotYetImplemented)
  | #toDistCombination(#Algebraic, operation, #Dist(value2)) =>
    value
    |> GenericDist.AlgebraicCombination.run(toPointSet, toSampleSet, operation, value2)
    |> E.R.fmap(r => #Dist(r))
    |> fromResult
  | #toDistCombination(#Pointwise, operation, #Dist(value2)) =>
    value
    |> GenericDist.pointwiseCombination(toPointSet, operation, value2)
    |> E.R.fmap(r => #Dist(r))
    |> fromResult
  | #toDistCombination(#Pointwise, operation, #Float(f)) =>
    value
    |> GenericDist.pointwiseCombinationFloat(toPointSet, operation, f)
    |> E.R.fmap(r => #Dist(r))
    |> fromResult
  }
}
