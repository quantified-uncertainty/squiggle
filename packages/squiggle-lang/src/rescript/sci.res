type symboliDist = SymbolicDistTypes.symbolicDist

type genericDist = [
  | #XYShape(PointSetTypes.pointSetDist)
  | #SampleSet(array<float>)
  | #Symbolic(symboliDist)
  | #Error(string)
  | #Float(float)
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

let distToFloat = (wrapped: wrapped, fnName) => {
  let (v, extra) = wrapped
  let newVal = switch (fnName, v) {
  | (operation, #XYShape(r)) => #Float(PointSetDist.operate(operation, r))
  | (operation, #Symbolic(r)) => switch(SymbolicDist.T.operate(operation, r)){
    | Ok(r) => #SymbolicDist(r)
    | Error(r) => #Error(r)
  }
  | _ => #Error("No Match")
  }
  (newVal, extra)
}

let distToDist = (wrapped: wrapped, fnName): wrapped => {
  let (v, extra) = wrapped
  let newVal = switch (fnName, v) {
  | (#normalize, #XYShape(r)) => #XYShape(PointSetDist.T.normalize(r))
  | (#normalize, #Symbolic(_)) => v
  | (#normalize, #SampleSet(_)) => v
  | (#toPointSet, #XYShape(_)) => v
  | (#toPointSet, #Symbolic(r)) => #XYShape(SymbolicDist.T.toPointSetDist(1000, r))
  | (#toPointSet, #SampleSet(r)) => {
      let response = SampleSet.toPointSetDist(
        ~samples=r,
        ~samplingInputs=defaultSamplingInputs,
        (),
      ).pointSetDist
      switch response {
      | Some(r) => #XYShape(r)
      | None => #Error("Failed to convert sample into shape")
      }
    }
  | _ => #Error("No Match")
  }
  (newVal, extra)
}
// | (#truncateLeft(f), #XYContinuous(r)) => #XYContinuous(Continuous.T.truncate(Some(f), None, r))
// | (#truncateRight(f), #XYContinuous(r)) => #XYContinuous(Continuous.T.truncate(None, Some(f), r))

let foo =
  exampleDist
  ->wrapWithParams(genericParams)
  ->distToDist(#truncateLeft(3.0))
  ->distToDist(#trunctateRight(5.0))
