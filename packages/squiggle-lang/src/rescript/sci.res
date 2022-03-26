type error =
  | NeedsPointSetConversion
  | InputsNeedPointSetConversion
  | NotYetImplemented
  | ImpossiblePath
  | Other(string)

type genericDist = [
  | #PointSet(PointSetTypes.pointSetDist)
  | #SampleSet(array<float>)
  | #Symbolic(SymbolicDistTypes.symbolicDist)
]

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

type direction = [
  | #Algebraic
  | #Pointwise
]

type combination = [
  | #Add
  | #Multiply
  | #Subtract
  | #Divide
  | #Exponentiate
]

let combinationToFn = (combination: combination) =>
  switch combination {
  | #Add => \"+."
  | #Multiply => \"*."
  | #Subtract => \"-."
  | #Exponentiate => \"**"
  | #Divide => \"/."
  }

type toFloat = [
  | #Cdf(float)
  | #Inv(float)
  | #Mean
  | #Pdf(float)
  | #Sample
]

type toDist = [
  | #normalize
  | #toPointSet
  | #toSampleSet(int)
]

type toFloatArray = [
  | #Sample(int)
]

type operation = [
  | #toFloat(toFloat)
  | #toDist(toDist)
  | #toDistCombination(direction, combination, genericDist)
]

type params = {
  sampleCount: int,
  xyPointLength: int,
}

let genericParams = {
  sampleCount: 1000,
  xyPointLength: 1000,
}

type wrapped = (genericDist, params)
type wrappedOutput = (outputType, params)

let wrapWithParams = (g: genericDist, f: params): wrapped => (g, f)

let exampleDist: genericDist = #PointSet(
  Discrete(Discrete.make(~integralSumCache=Some(1.0), {xs: [3.0], ys: [1.0]})),
)

let defaultSamplingInputs: SamplingInputs.samplingInputs = {
  sampleCount: 10000,
  outputXYPoints: 10000,
  pointSetDistLength: 1000,
  kernelWidth: None,
}

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution. */
module AlgebraicCombination = {
  let tryAnalyticalSimplification = (operation, t1: genericDist, t2: genericDist) =>
    switch (operation, t1, t2) {
    | (operation, #Symbolic(d1), #Symbolic(d2)) =>
      switch SymbolicDist.T.tryAnalyticalSimplification(d1, d2, operation) {
      | #AnalyticalSolution(symbolicDist) => Ok(#Symbolic(symbolicDist))
      | #Error(er) => Error(er)
      | #NoSolution => Ok(#NoSolution)
      }
    | _ => Ok(#NoSolution)
    }
}

// let toSampleSet = (r)

let sampleN = (n, genericDist) => {
  switch genericDist {
  | #PointSet(r) => Ok(PointSetDist.sampleNRendered(n, r))
  | #Symbolic(r) => Ok(SymbolicDist.T.sampleN(n, r))
  | #SampleSet(_) => Error(NotYetImplemented)
  }
}

let toFloat = (
  toPointSet: genericDist => result<PointSetTypes.pointSetDist, error>,
  fnName,
  value,
) => {
  switch value {
  | #Symbolic(r) if Belt.Result.isOk(SymbolicDist.T.operate(fnName, r)) =>
    switch SymbolicDist.T.operate(fnName, r) {
    | Ok(float) => Ok(float)
    | Error(_) => Error(ImpossiblePath)
    }
  | #PointSet(r) => Ok(PointSetDist.operate(fnName, r))
  | _ =>
    switch toPointSet(value) {
    | Ok(r) => Ok(PointSetDist.operate(fnName, r))
    | Error(r) => Error(r)
    }
  }
}

let distToPointSet = (sampleCount, dist: genericDist) => {
  switch dist {
  | #PointSet(pointSet) => Ok(pointSet)
  | #Symbolic(r) => Ok(SymbolicDist.T.toPointSetDist(sampleCount, r))
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

let rec applyFnInternal = (wrapped: wrapped, fnName: operation): wrappedOutput => {
  let (value, {sampleCount, xyPointLength} as extra) = wrapped
  let reCall = (~value=value, ~extra=extra, ~fnName=fnName, ()) => {
    applyFnInternal((value, extra), fnName)
  }
  let reCallUnwrapped = (~value=value, ~extra=extra, ~fnName=fnName, ()) => {
    let (value, _) = applyFnInternal((value, extra), fnName)
    value
  }
  let toPointSet = r => {
    switch reCallUnwrapped(~value=r, ~fnName=#toDist(#toPointSet), ()) {
    | #Dist(#PointSet(p)) => Ok(p)
    | #Error(r) => Error(r)
    | _ => Error(Other("Impossible error"))
    }
  }
  let toPointSetAndReCall = v =>
    toPointSet(v) |> E.R.fmap(r => reCallUnwrapped(~value=#PointSet(r), ()))
  let newVal: outputType = switch (fnName, value) {
  // | (#toFloat(n), v) => toFloat(toPointSet, v, n)
  | (#toFloat(fnName), _) =>
    toFloat(toPointSet, fnName, value) |> E.R.fmap(r => #Float(r)) |> fromResult
  | (#toDist(#normalize), #PointSet(r)) => #Dist(#PointSet(PointSetDist.T.normalize(r)))
  | (#toDist(#normalize), #Symbolic(_)) => #Dist(value)
  | (#toDist(#normalize), #SampleSet(_)) => #Dist(value)
  | (#toDist(#toPointSet), _) =>
    value |> distToPointSet(sampleCount) |> E.R.fmap(r => #Dist(#PointSet(r))) |> fromResult
  | (#toDist(#toSampleSet(n)), _) =>
    value |> sampleN(n) |> E.R.fmap(r => #Dist(#SampleSet(r))) |> fromResult
  | (#toDistCombination(#Algebraic, operation, p2), p1) => {
      // TODO: This could be more complex, to get possible simplification and similar.
      let dist1 = sampleN(sampleCount, p1)
      let dist2 = sampleN(sampleCount, p2)
      let samples = E.R.merge(dist1, dist2) |> E.R.fmap(((d1, d2)) => {
        Belt.Array.zip(d1, d2) |> E.A.fmap(((a, b)) => Operation.Algebraic.toFn(operation, a, b))
      })
      switch samples {
      | Ok(r) => #Dist(#SampleSet(r))
      | Error(e) => #Error(e)
      }
    }
  | (#toDistCombination(#Pointwise, operation, p2), p1) =>
    switch (
      toPointSet(p1),
      toPointSet(p2)
    ) {
    | (Ok(p1), Ok(p2)) =>
      // TODO: If the dist is symbolic, then it doesn't need to be converted into a pointSet
      #Dist(#PointSet(PointSetDist.combinePointwise(combinationToFn(operation), p1, p2)))
    | (_, _) => #Error(Other("No Match or not supported"))
    }
  | _ => #Error(Other("No Match or not supported"))
  }
  (newVal, {sampleCount: sampleCount, xyPointLength: xyPointLength})
}

// let applyFn = (wrapped, fnName): wrapped => {
//   let (v, extra) as result = applyFnInternal(wrapped, fnName)
//   switch v {
//   | #Error(NeedsPointSetConversion) => {
//       let convertedToPointSet = applyFnInternal(wrapped, #toDist(#toPointSet))
//       applyFnInternal(convertedToPointSet, fnName)
//     }
//   | #Error(InputsNeedPointSetConversion) => {
//       let altDist = switch fnName {
//       | #toDistCombination(p1, p2, dist) => {
//           let (newDist, _) = applyFnInternal((dist, extra), #toDist(#toPointSet))
//           applyFnInternal(wrapped, #toDistCombination(p1, p2, newDist))
//         }
//       | _ => (#Error(Other("Not needed")), extra)
//       }
//       altDist
//     }
//   | _ => result
//   }
// }

// let foo = exampleDist->wrapWithParams(genericParams)->applyFn(#toDist(#normalize))
