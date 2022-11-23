@genType type pointSetDistribution = PointSetTypes.pointSetDist
// temporary copy-paste
@genType
type rec continuousShape = {
  xyShape: XYShape.xyShape,
  interpolation: XYShape.interpolationStrategy,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

@genType
type discreteShape = {
  xyShape: XYShape.xyShape,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

@genType
type mixedShape = {
  continuous: continuousShape,
  discrete: discreteShape,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

@module("./ForTS_Distribution_PointSetDistribution_tag") @scope("pointSetDistributionTag")
external pstMixed_: string = "Mixed"

@module("./ForTS_Distribution_PointSetDistribution_tag") @scope("pointSetDistributionTag")
external pstDiscrete_: string = "Discrete"

@module("./ForTS_Distribution_PointSetDistribution_tag") @scope("pointSetDistributionTag")
external pstContinuous_: string = "Continuous"

@genType.import("./ForTS_Distribution_PointSetDistribution_tag")
type pointSetDistributionTag

external castEnum: string => pointSetDistributionTag = "%identity"

external castContinuousShape: 'd => continuousShape = "%identity"
external castDiscreteShape: 'd => discreteShape = "%identity"
external castMixedShape: 'd => mixedShape = "%identity"

@genType
let getTag = (variant: pointSetDistribution): pointSetDistributionTag =>
  switch variant {
  | Mixed(_) => pstMixed_->castEnum
  | Discrete(_) => pstDiscrete_->castEnum
  | Continuous(_) => pstContinuous_->castEnum
  }

@genType
let getMixed = (variant: pointSetDistribution): 'd =>
  switch variant {
  | Mixed(mixed) => mixed->castMixedShape->Some
  | _ => None
  }

@genType
let getDiscrete = (variant: pointSetDistribution): 'd =>
  switch variant {
  | Discrete(discrete) => discrete->castDiscreteShape->Some
  | _ => None
  }

@genType
let getContinues = (variant: pointSetDistribution): 'd =>
  switch variant {
  | Continuous(continuous) => continuous->castContinuousShape->Some
  | _ => None
  }

@genType
let toDistribution = (v: pointSetDistribution): DistributionTypes.genericDist => PointSet(v)
