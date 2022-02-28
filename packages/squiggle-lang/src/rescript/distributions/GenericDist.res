type distribution =
  | SymbolicDist(SymbolicDistTypes.symbolicDist)
  | PointSetDist(PointSetTypes.pointSetDist)
  | SampleSetDist(SampleSet.Internals.Types.outputs)

module Distributions = {
  module D = E.Threither(
    {type tau = SymbolicDistTypes.symbolicDist},
    {type tau = PointSetTypes.pointSetDist},
    {type tau = SampleSet.Internals.Types.outputs}
  )



}

type distinputs =
  | Symb(SymbolicDistTypes.symbolicDist)
  | PS(PointSetTypes.pointSetDist)
  | SS(SampleSet.Internals.Types.outputs)

module type theDist = {
  let t: distribution
}

module TheDistribution = (Thedist: theDist) => {
  let t = Thedist.t
  let thedistribution: distinputs = switch t {
      | SymbolicDist(symbdist) => Symb(symbdist)
      | PointSetDist(pointsetdist) => PS(pointsetdist)
      | SampleSetDist(samplesetdist) => SS(samplesetdist)
  }
}
