//FIXME accessor methods or not opaque?
@genType.opaque
type genericDist =
  | PointSet(PointSetTypes.pointSetDist)
  | SampleSet(SampleSetDist.t)
  | Symbolic(SymbolicDistTypes.symbolicDist)

type asAlgebraicCombinationStrategy = AsDefault | AsSymbolic | AsMonteCarlo | AsConvolution

@genType.opaque
type error =
  | NotYetImplemented
  | Unreachable
  | DistributionVerticalShiftIsInvalid
  | SampleSetError(SampleSetDist.sampleSetError)
  | ArgumentError(string)
  | OperationError(Operation.Error.t)
  | PointSetConversionError(SampleSetDist.pointsetConversionError)
  | SparklineError(PointSetTypes.sparklineError) // This type of error is for when we find a sparkline of a discrete distribution. This should probably at some point be actually implemented
  | RequestedStrategyInvalidError(string)
  | LogarithmOfDistributionError(string)
  | OtherError(string)
  | XYShapeError(XYShape.error)

@genType
module Error = {
  type t = error

  let fromString = (s: string): t => OtherError(s)

  let toString = (err: error): string =>
    switch err {
    | NotYetImplemented => "Function not yet implemented"
    | Unreachable => "Unreachable"
    | DistributionVerticalShiftIsInvalid => "Distribution vertical shift is invalid"
    | ArgumentError(s) => `Argument Error ${s}`
    | LogarithmOfDistributionError(s) => `Logarithm of input error: ${s}`
    | SampleSetError(TooFewSamples) => "Too Few Samples"
    | SampleSetError(NonNumericInput(err)) => `Found a non-number in input: ${err}`
    | SampleSetError(OperationError(err)) => Operation.Error.toString(err)
    | OperationError(err) => Operation.Error.toString(err)
    | PointSetConversionError(err) => SampleSetDist.pointsetConversionErrorToString(err)
    | SparklineError(err) => PointSetTypes.sparklineErrorToString(err)
    | RequestedStrategyInvalidError(err) => `Requested strategy invalid: ${err}`
    | XYShapeError(err) => `XY Shape Error: ${XYShape.Error.toString(err)}`
    | OtherError(s) => s
    }

  let resultStringToResultError: result<'a, string> => result<'a, error> = n =>
    n->E.R.errMap(r => r->fromString)

  let sampleErrorToDistErr = (err: SampleSetDist.sampleSetError): error => SampleSetError(err)
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

  type toScaleFn = [
    | #Multiply
    | #Power
    | #Logarithm
    | #LogarithmWithThreshold(float)
  ]

  type toDist =
    | Normalize
    | ToPointSet
    | ToSampleSet(int)
    | Scale(toScaleFn, float)
    | Truncate(option<float>, option<float>)
    | Inspect

  type toFloatArray = Sample(int)

  type genericDistOrScalar = Score_Dist(genericDist) | Score_Scalar(float)

  type toScore = LogScore(genericDistOrScalar, option<genericDist>)

  type t = [
    | #ToDist(toDist)
    | #ToDistCombination(direction, Operation.Algebraic.t, genericDist)
    | #ToScore(toScore)
  ]
}

module Constructors = {
  type t = DistributionOperation.t

  module UsingDists = {
    @genType
    let normalize: t = #ToDist(Normalize)
    let toPointSet: t = #ToDist(ToPointSet)
    let toSampleSet = (r): t => #ToDist(ToSampleSet(r))
    let truncate = (left, right): t => #ToDist(Truncate(left, right))
    let inspect: t = #ToDist(Inspect)
    module LogScore = {
      let distEstimateDistAnswer = (answer): t => #ToScore(LogScore(Score_Dist(answer), None))
      let distEstimateDistAnswerWithPrior = (answer, prior): t =>
        #ToScore(LogScore(Score_Dist(answer), Some(prior)))
      let distEstimateScalarAnswer = (answer): t => #ToScore(LogScore(Score_Scalar(answer), None))
      let distEstimateScalarAnswerWithPrior = (answer, prior): t =>
        #ToScore(LogScore(Score_Scalar(answer), Some(prior)))
    }
    let scaleMultiply = (n): t => #ToDist(Scale(#Multiply, n))
    let scalePower = (n): t => #ToDist(Scale(#Power, n))
    let scaleLogarithm = (n): t => #ToDist(Scale(#Logarithm, n))
    let scaleLogarithmWithThreshold = (n, eps): t => #ToDist(Scale(#LogarithmWithThreshold(eps), n))
    let algebraicAdd = (dist2: genericDist): t =>
      #ToDistCombination(Algebraic(AsDefault), #Add, dist2)
    let algebraicMultiply = (dist2): t => #ToDistCombination(Algebraic(AsDefault), #Multiply, dist2)
    let algebraicDivide = (dist2): t => #ToDistCombination(Algebraic(AsDefault), #Divide, dist2)
    let algebraicSubtract = (dist2): t => #ToDistCombination(Algebraic(AsDefault), #Subtract, dist2)
    let algebraicLogarithm = (dist2): t =>
      #ToDistCombination(Algebraic(AsDefault), #Logarithm, dist2)
    let algebraicPower = (dist2): t => #ToDistCombination(Algebraic(AsDefault), #Power, dist2)
    let pointwiseAdd = (dist2): t => #ToDistCombination(Pointwise, #Add, dist2)
    let pointwiseMultiply = (dist2): t => #ToDistCombination(Pointwise, #Multiply, dist2)
    let pointwiseDivide = (dist2): t => #ToDistCombination(Pointwise, #Divide, dist2)
    let pointwiseSubtract = (dist2): t => #ToDistCombination(Pointwise, #Subtract, dist2)
    let pointwiseLogarithm = (dist2): t => #ToDistCombination(Pointwise, #Logarithm, dist2)
    let pointwisePower = (dist2): t => #ToDistCombination(Pointwise, #Power, dist2)
  }
}
