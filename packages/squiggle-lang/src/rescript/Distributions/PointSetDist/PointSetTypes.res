type distributionType = [
  | #PDF
  | #CDF
]

@genType
type xyShape = XYShape.xyShape
type interpolationStrategy = XYShape.interpolationStrategy

// double opaque
@genType.opaque
type continuousShape
@genType.opaque
type discreteShape
@genType.opaque
type mixedShape
@genType.opaque
type pointSetDist

type mixedPoint
