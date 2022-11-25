//FIXME accessor methods or not opaque?
@genType.opaque
type genericDist =
  | PointSet(PointSetTypes.pointSetDist)
  | SampleSet(SampleSetDist.t)
  | Symbolic(SymbolicDistTypes.symbolicDist)

type asAlgebraicCombinationStrategy = AsDefault | AsSymbolic | AsMonteCarlo | AsConvolution

@genType.opaque
type error = DistError.t

@genType
module Error = {
  type t = error

  let fromString = DistError.fromString

  let toString = DistError.toString

  let resultStringToResultError: result<'a, string> => result<'a, error> = n =>
    n->E.R.errMap(r => r->fromString)
}

@genType
module DistributionOperation = {
  @genType
  type pointsetXSelection = [#Linear | #ByWeight]

  type direction =
    | Algebraic(asAlgebraicCombinationStrategy)
    | Pointwise

  type toFloat = [
    | #Cdf(float)
    | #Inv(float)
    | #Pdf(float)
    | #Mean
    | #Sample
    | #IntegralSum
    | #Mode
    | #Stdev
    | #Min
    | #Max
    | #Variance
  ]
}
