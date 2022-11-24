// Genetic Distribution happens to be abstract distribution
@genType type distribution = DistributionTypes.genericDist
@genType type distributionError = DistributionTypes.error
@genType type pointSetDistribution = ForTS_Distribution_PointSetDistribution.pointSetDistribution
@genType type symbolicDistribution = ForTS_Distribution_SymbolicDistribution.symbolicDistribution

type environment = ForTS_Distribution_Environment.environment //use

@genType
let defaultEnvironment: environment = Reducer_Context.defaultEnvironment

@module("./ForTS_Distribution_tag") @scope("distributionTag")
external dtPointSet_: string = "PointSet"

@module("./ForTS_Distribution_tag") @scope("distributionTag")
external dtSampleSet_: string = "SampleSet"

@module("./ForTS_Distribution_tag") @scope("distributionTag")
external dtSymbolic_: string = "Symbolic"

@genType.import("./ForTS_Distribution_tag")
type distributionTag

external castEnum: string => distributionTag = "%identity"

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
let getSymbolic = (variant: distribution): option<symbolicDistribution> =>
  switch variant {
  | Symbolic(dist) => dist->Some
  | _ => None
  }

@genType
let mean = GenericDist.mean
@genType
let stdev = GenericDist.stdev
@genType
let variance = GenericDist.variance
@genType
let sample = GenericDist.sample
@genType
let cdf = GenericDist.cdf
@genType
let inv = GenericDist.inv
@genType
let pdf = GenericDist.pdf

@genType
let normalize = GenericDist.normalize

@genType
let toPointSet = (variant: distribution, env: environment) =>
  GenericDist.toPointSet(variant, ~env, ())

@genType
let toString = (variant: distribution) => GenericDist.toString(variant)
