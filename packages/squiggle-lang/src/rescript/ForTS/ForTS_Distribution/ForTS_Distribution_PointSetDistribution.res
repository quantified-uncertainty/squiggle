@genType type pointSetDistribution = PointSetTypes.pointSetDist
@genType type continuousShape = PointSetTypes.continuousShape
@genType type discreteShape = PointSetTypes.discreteShape
@genType type mixedShape = PointSetTypes.mixedShape

@module("./ForTS_Distribution_PointSetDistribution_tag") @scope("pointSetDistributionTag")
external pstMixed_: string = "Mixed"

@module("./ForTS_Distribution_PointSetDistribution_tag") @scope("pointSetDistributionTag")
external pstDiscrete_: string = "Discrete"

@module("./ForTS_Distribution_PointSetDistribution_tag") @scope("pointSetDistributionTag")
external pstContinuous_: string = "Continuous"

@genType.import("./ForTS_Distribution_PointSetDistribution_tag")
type pointSetDistributionTag

external castEnum: string => pointSetDistributionTag = "%identity"

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
  | Mixed(mixed) => mixed->Some
  | _ => None
  }

@genType
let getDiscrete = (variant: pointSetDistribution): 'd =>
  switch variant {
  | Discrete(discrete) => discrete->Some
  | _ => None
  }

@genType
let getContinues = (variant: pointSetDistribution): 'd =>
  switch variant {
  | Continuous(continuous) => continuous->Some
  | _ => None
  }
