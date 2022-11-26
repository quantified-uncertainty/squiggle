@genType.opaque
type genericDist

@genType
module DistributionOperation = {
  @genType
  type pointsetXSelection = [#Linear | #ByWeight]

  type toFloat = [
    | #Mode
    | #Stdev
    | #Variance
  ]
}
