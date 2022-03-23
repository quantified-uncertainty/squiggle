type symboliDist = SymbolicDistTypes.symbolicDist

type error =
  | NeedsPointSetConversion
  | Other(string)

type genericDist = [
  | #XYShape(PointSetTypes.pointSetDist)
  | #SampleSet(array<float>)
  | #Symbolic(symboliDist)
  | #Error(error)
  | #Float(float)
]

type combination = [
  | #Add
  | #Multiply
  | #Subtract
  | #Divide
  | #Exponentiate
]

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
]

type operation = [
  | #toFloat(toFloat)
  | #toDist(toDist)
  | #toDistCombination(combination, genericDist)
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

let applyFnInternal = (wrapped: wrapped, fnName: operation): wrapped => {
  let (v, extra) = wrapped
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
  | (#toDist(#toPointSet), #Symbolic(r)) => #XYShape(SymbolicDist.T.toPointSetDist(1000, r))
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
  | _ => #Error(Other("No Match or not supported"))
  }
  (newVal, extra)
}

let applyFn = (wrapped, fnName): wrapped => {
  let (v, extra) as result = applyFnInternal(wrapped, fnName)
  switch v {
  | #Error(NeedsPointSetConversion) => {
      let convertedToPointSet = applyFnInternal(wrapped, #toDist(#toPointSet))
      applyFnInternal(convertedToPointSet, fnName)
    }
  | _ => result
  }
}

let foo = exampleDist->wrapWithParams(genericParams)->applyFn(#toDist(#normalize))
