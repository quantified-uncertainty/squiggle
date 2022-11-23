let buildSimple = (
  ~continuous: option<PointSetTypes.continuousShape>,
  ~discrete: option<PointSetTypes.discreteShape>,
): option<PointSetTypes.pointSetDist> => {
  let continuous =
    continuous->E.O.defaultFn(() => Continuous.make(~integralSumCache=Some(0.0), {xs: [], ys: []}))
  let discrete =
    discrete->E.O.defaultFn(() => Discrete.make(~integralSumCache=Some(0.0), {xs: [], ys: []}))
  let cLength = continuous.xyShape->XYShape.T.xs->E.A.length
  let dLength = discrete->Discrete.getShape->XYShape.T.xs->E.A.length
  switch (cLength, dLength) {
  | (0 | 1, 0) => None
  | (0 | 1, _) => Some(Discrete(discrete))
  | (_, 0) => Some(Continuous(continuous))
  | (_, _) =>
    let mixedDist = Mixed.make(~integralSumCache=None, ~integralCache=None, ~continuous, ~discrete)
    Some(Mixed(mixedDist))
  }
}
