@genType type pointSetDistribution = PointSetTypes.pointSetDist

@genType
let toDistribution = (v: pointSetDistribution): DistributionTypes.genericDist => PointSet(v)
