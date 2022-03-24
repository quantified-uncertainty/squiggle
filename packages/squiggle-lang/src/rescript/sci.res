type symboliDist = SymbolicDistTypes.symbolicDist

type error =
  | NeedsPointSetConversion
  | InputsNeedPointSetConversion
  | NotYetImplemented
  | Other(string)

type genericDist = [
  | #XYShape(PointSetTypes.pointSetDist)
  | #SampleSet(array<float>)
  | #Symbolic(symboliDist)
  | #Error(error)
  | #Float(float)
]

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

let wrapWithParams = (g: genericDist, f: params): wrapped => (g, f)

let exampleDist: genericDist = #XYShape(
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
  | #XYShape(r) => Ok(PointSetDist.sampleNRendered(n, r))
  | #Symbolic(r) => Ok(SymbolicDist.T.sampleN(n, r))
  | #SampleSet(r) => Error(NotYetImplemented)
  | #Error(r) => Error(r)
  | _ => Error(NotYetImplemented)
  }
}

let rec applyFnInternal = (wrapped: wrapped, fnName: operation): wrapped => {
  let (v, {sampleCount, xyPointLength} as extra) = wrapped
  let newVal: genericDist = switch (fnName, v) {
  | (#toFloat(n), #XYShape(r)) => #Float(PointSetDist.operate(n, r))
  | (#toFloat(n), #Symbolic(r)) =>
    switch SymbolicDist.T.operate(n, r) {
    | Ok(float) => #Float(float)
    | Error(e) => #Error(Other(e))
    }
  | (#toFloat(n), #SampleSet(_)) => #Error(NeedsPointSetConversion)
  | (#toDist(#normalize), #XYShape(r)) => #XYShape(PointSetDist.T.normalize(r))
  | (#toDist(#normalize), #Symbolic(_)) => v
  | (#toDist(#normalize), #SampleSet(_)) => v
  | (#toDist(#toPointSet), #XYShape(_)) => v
  | (#toDist(#toPointSet), #Symbolic(r)) => #XYShape(SymbolicDist.T.toPointSetDist(sampleCount, r))
  | (#toDist(#toPointSet), #SampleSet(r)) => {
      let response = SampleSet.toPointSetDist(
        ~samples=r,
        ~samplingInputs=defaultSamplingInputs,
        (),
      ).pointSetDist
      switch response {
      | Some(r) => #XYShape(r)
      | None => #Error(Other("Failed to convert sample into shape"))
      }
    }
  | (#toDist(#toSampleSet(n)), r) =>
    switch sampleN(n, r) {
    | Ok(r) => #SampleSet(r)
    | Error(r) => #Error(r)
    }
  | (#toDistCombination(#Algebraic, operation, p2), p1) => {
      // TODO: This could be more complex, to get possible simplification and similar.
      let dist1 = sampleN(sampleCount, p1)
      let dist2 = sampleN(sampleCount, p2)
      let samples = E.R.merge(dist1, dist2) |> E.R.fmap(((d1, d2)) => {
        Belt.Array.zip(d1, d2) |> E.A.fmap(((a, b)) => Operation.Algebraic.toFn(operation, a, b))
      })
      switch samples {
      | Ok(r) => #SampleSet(r)
      | Error(e) => #Error(e)
      }
    }
  | (#toDistCombination(#Pointwise, operation, p2), p1) =>
    switch (
      applyFnInternal((p1, extra), #toDist(#toPointSet)),
      applyFnInternal((p2, extra), #toDist(#toPointSet)),
    ) {
    | ((#XYShape(p1), _), (#XYShape(p2), _)) =>
      #XYShape(PointSetDist.combinePointwise(combinationToFn(operation), p1, p2))
    | _ => #Error(Other("No Match or not supported"))
    }
  | _ => #Error(Other("No Match or not supported"))
  }
  (newVal, {sampleCount: sampleCount, xyPointLength: xyPointLength})
}

let applyFn = (wrapped, fnName): wrapped => {
  let (v, extra) as result = applyFnInternal(wrapped, fnName)
  switch v {
  | #Error(NeedsPointSetConversion) => {
      let convertedToPointSet = applyFnInternal(wrapped, #toDist(#toPointSet))
      applyFnInternal(convertedToPointSet, fnName)
    }
  | #Error(InputsNeedPointSetConversion) => {
      let altDist = switch fnName {
      | #toDistCombination(p1, p2, dist) => {
          let (newDist, _) = applyFnInternal((dist, extra), #toDist(#toPointSet))
          applyFnInternal(wrapped, #toDistCombination(p1, p2, newDist))
        }
      | _ => (#Error(Other("Not needed")), extra)
      }
      altDist
    }
  | _ => result
  }
}

let foo = exampleDist->wrapWithParams(genericParams)->applyFn(#toDist(#normalize))
