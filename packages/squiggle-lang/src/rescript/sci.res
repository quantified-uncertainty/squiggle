type symboliDist = SymbolicDistTypes.symbolicDist;

type genericDist = [
  | #XYContinuous(PointSetTypes.continuousShape)
  | #XYDiscrete(Discrete.t)
  | #SampleSet(array<float>)
  | #Symbolic(symboliDist)
  | #Error(string)
]

let isSymbolic = (r: genericDist) =>
  switch r {
  | #Symbolic(_) => true
  | _ => false
  }

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

let exampleDist: genericDist = #XYDiscrete(
  Discrete.make(~integralSumCache=Some(1.0), {xs: [3.0], ys: [1.0]}),
)

let rec isFunctionPossible = (wrapped: wrapped, fnName): bool => {
  let (v, _) = wrapped
  switch (fnName, v) {
  | (#truncateLeft(_), #XYContinuous(_)) => true
  | (#truncateRight(_), #XYContinuous(_)) => true
  | _ => false
  }
}

let rec doFunction = (wrapped: wrapped, fnName): wrapped => {
  let (v, extra) = wrapped
  let newVal = switch (fnName, v) {
  | (#truncateLeft(f), #XYContinuous(r)) => #XYContinuous(Continuous.T.truncate(Some(f), None, r))
  | (#truncateRight(f), #XYContinuous(r)) => #XYContinuous(Continuous.T.truncate(None, Some(f), r))
  | (#toPointSet, #XYContinuous(r)) => v
  | (#toPointSet, #XYDiscrete(r)) => v
  | (#toPointSet, #Symbolic(#Float(f))) => #XYDiscrete(Discrete.make(~integralSumCache=Some(1.0), {xs: [f], ys: [1.0]}));
  | (#toPointSet, #Symbolic(r)) => {
      let xs = SymbolicDist.T.interpolateXs(~xSelection=#ByWeight, r, 1000)
      let ys = xs |> E.A.fmap(x => SymbolicDist.T.pdf(x, r))
      #XYContinuous(Continuous.make(~integralSumCache=Some(1.0), {xs: xs, ys: ys}))
  }
  | _ => #Error("No Match")
  }
  (newVal, extra)
}

let foo = exampleDist->wrapWithParams(genericParams)->doFunction(#truncateLeft(3.0))