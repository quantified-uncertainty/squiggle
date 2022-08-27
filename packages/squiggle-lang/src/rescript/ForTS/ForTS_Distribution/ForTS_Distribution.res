// Genetic Distribution happens to be abstract distribution
@genType type distribution = DistributionTypes.genericDist
@genType type distributionError = DistributionTypes.error
@genType type pointSetDistribution = ForTS_Distribution_PointSetDistribution.pointSetDistribution
@genType type sampleSetDistribution = ForTS_Distribution_SampleSetDistribution.sampleSetDistribution
@genType type symbolicDistribution = ForTS_Distribution_SymbolicDistribution.symbolicDistribution

type environment = ForTS_Distribution_Environment.environment //use

@genType
let defaultEnvironment: environment = DistributionOperation.defaultEnv

@module("ForTS_Distribution_tag") @scope("distributionTag")
external dtPointSet_: int = "DtPointSet"

@module("ForTS_Distribution_tag") @scope("distributionTag")
external dtSampleSet_: int = "DtSampleSet"

@module("ForTS_Distribution_tag") @scope("distributionTag")
external dtSymbolic_: int = "DtSymbolic"

@genType.import("./ForTS_Distribution_tag")
type distributionTag

external castEnum: int => distributionTag = "%identity"

// type genericDist =
//   | PointSet(PointSetTypes.pointSetDist)
//   | SampleSet(SampleSetDist.t)
//   | Symbolic(SymbolicDistTypes.symbolicDist)
@genType
let getTag = (variant: distribution): distributionTag =>
  switch variant {
  | PointSet(_) => dtPointSet_->castEnum
  | SampleSet(_) => dtSampleSet_->castEnum
  | Symbolic(_) => dtSymbolic_->castEnum
  }

@genType
let getPointSet = (variant: distribution): option<pointSetDistribution> =>
  switch variant {
  | PointSet(dist) => dist->Some
  | _ => None
  }

@genType
let getSampleSet = (variant: distribution): option<sampleSetDistribution> =>
  switch variant {
  | SampleSet(dist) => dist->Some
  | _ => None
  }

@genType
let getSymbolic = (variant: distribution): option<symbolicDistribution> =>
  switch variant {
  | Symbolic(dist) => dist->Some
  | _ => None
  }

@genType
let mean = DistributionOperation.Constructors.mean

@genType
let stdev = DistributionOperation.Constructors.stdev
@genType
let variance = DistributionOperation.Constructors.variance
@genType
let sample = DistributionOperation.Constructors.sample
@genType
let cdf = DistributionOperation.Constructors.cdf
@genType
let inv = DistributionOperation.Constructors.inv
@genType
let pdf = DistributionOperation.Constructors.pdf
@genType
let normalize = DistributionOperation.Constructors.normalize

@genType
let toPointSet = (variant: distribution, env: environment) =>
  GenericDist.toPointSet(variant, ~sampleCount=env.sampleCount, ~xyPointLength=env.xyPointLength, ())

@genType
let toString = (variant: distribution) =>
  GenericDist.toString(variant)
