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

  type toBool = IsNormalized

  type toString =
    | ToString
    | ToSparkline(int)

  type genericDistOrScalar = Score_Dist(genericDist) | Score_Scalar(float)

  type toScore = LogScore(genericDistOrScalar, option<genericDist>)

  type fromFloat = [
    | #ToFloat(toFloat)
    | #ToDist(toDist)
    | #ToDistCombination(direction, Operation.Algebraic.t, [#Dist(genericDist) | #Float(float)])
    | #ToString(toString)
    | #ToBool(toBool)
  ]

  type fromDist = [
    | fromFloat
    | #ToScore(toScore)
  ]

  type singleParamaterFunction =
    | FromDist(fromDist)
    | FromFloat(fromFloat)

  type genericFunctionCallInfo =
    | FromDist(fromDist, genericDist)
    | FromFloat(fromFloat, float)
    | FromSamples(array<float>)
    | Mixture(array<(genericDist, float)>)

  let floatCallToString = (floatFunction: fromFloat): string =>
    switch floatFunction {
    | #ToFloat(#Cdf(r)) => `cdf(${E.Float.toFixed(r)})`
    | #ToFloat(#Inv(r)) => `inv(${E.Float.toFixed(r)})`
    | #ToFloat(#Mean) => `mean`
    | #ToFloat(#Min) => `min`
    | #ToFloat(#Max) => `max`
    | #ToFloat(#Stdev) => `stdev`
    | #ToFloat(#Variance) => `variance`
    | #ToFloat(#Mode) => `mode`
    | #ToFloat(#Pdf(r)) => `pdf(${E.Float.toFixed(r)})`
    | #ToFloat(#Sample) => `sample`
    | #ToFloat(#IntegralSum) => `integralSum`
    | #ToDist(Normalize) => `normalize`
    | #ToDist(ToPointSet) => `toPointSet`
    | #ToDist(ToSampleSet(r)) => `toSampleSet(${E.I.toString(r)})`
    | #ToDist(Truncate(_, _)) => `truncate`
    | #ToDist(Inspect) => `inspect`
    | #ToDist(Scale(#Power, r)) => `scalePower(${E.Float.toFixed(r)})`
    | #ToDist(Scale(#Multiply, r)) => `scaleMultiply(${E.Float.toFixed(r)})`
    | #ToDist(Scale(#Logarithm, r)) => `scaleLog(${E.Float.toFixed(r)})`
    | #ToDist(Scale(#LogarithmWithThreshold(eps), r)) =>
      `scaleLogWithThreshold(${E.Float.toFixed(r)}, epsilon=${E.Float.toFixed(eps)})`
    | #ToString(ToString) => `toString`
    | #ToString(ToSparkline(n)) => `sparkline(${E.I.toString(n)})`
    | #ToBool(IsNormalized) => `isNormalized`
    | #ToDistCombination(Algebraic(_), _, _) => `algebraic`
    | #ToDistCombination(Pointwise, _, _) => `pointwise`
    }

  let distCallToString = (
    distFunction: [
      | #ToFloat(toFloat)
      | #ToDist(toDist)
      | #ToDistCombination(direction, Operation.Algebraic.t, [#Dist(genericDist) | #Float(float)])
      | #ToString(toString)
      | #ToBool(toBool)
      | #ToScore(toScore)
    ],
  ): string =>
    switch distFunction {
    | #ToScore(_) => `logScore`
    | #ToFloat(x) => floatCallToString(#ToFloat(x))
    | #ToDist(x) => floatCallToString(#ToDist(x))
    | #ToString(x) => floatCallToString(#ToString(x))
    | #ToBool(x) => floatCallToString(#ToBool(x))
    | #ToDistCombination(x, y, z) => floatCallToString(#ToDistCombination(x, y, z))
    }

  let toString = (d: genericFunctionCallInfo): string =>
    switch d {
    | FromDist(f, _) => distCallToString(f)
    | FromFloat(f, _) => floatCallToString(f)
    | Mixture(_) => `mixture`
    | FromSamples(_) => `fromSamples`
    }
}
module Constructors = {
  type t = DistributionOperation.genericFunctionCallInfo

  module UsingDists = {
    @genType
    let mean = (dist): t => FromDist(#ToFloat(#Mean), dist)
    let stdev = (dist): t => FromDist(#ToFloat(#Stdev), dist)
    let variance = (dist): t => FromDist(#ToFloat(#Variance), dist)
    let sample = (dist): t => FromDist(#ToFloat(#Sample), dist)
    let cdf = (dist, x): t => FromDist(#ToFloat(#Cdf(x)), dist)
    let inv = (dist, x): t => FromDist(#ToFloat(#Inv(x)), dist)
    let pdf = (dist, x): t => FromDist(#ToFloat(#Pdf(x)), dist)
    let normalize = (dist): t => FromDist(#ToDist(Normalize), dist)
    let isNormalized = (dist): t => FromDist(#ToBool(IsNormalized), dist)
    let toPointSet = (dist): t => FromDist(#ToDist(ToPointSet), dist)
    let toSampleSet = (dist, r): t => FromDist(#ToDist(ToSampleSet(r)), dist)
    let fromSamples = (xs): t => FromSamples(xs)
    let truncate = (dist, left, right): t => FromDist(#ToDist(Truncate(left, right)), dist)
    let inspect = (dist): t => FromDist(#ToDist(Inspect), dist)
    module LogScore = {
      let distEstimateDistAnswer = (estimate, answer): t => FromDist(
        #ToScore(LogScore(Score_Dist(answer), None)),
        estimate,
      )
      let distEstimateDistAnswerWithPrior = (estimate, answer, prior): t => FromDist(
        #ToScore(LogScore(Score_Dist(answer), Some(prior))),
        estimate,
      )
      let distEstimateScalarAnswer = (estimate, answer): t => FromDist(
        #ToScore(LogScore(Score_Scalar(answer), None)),
        estimate,
      )
      let distEstimateScalarAnswerWithPrior = (estimate, answer, prior): t => FromDist(
        #ToScore(LogScore(Score_Scalar(answer), Some(prior))),
        estimate,
      )
    }
    let scaleMultiply = (dist, n): t => FromDist(#ToDist(Scale(#Multiply, n)), dist)
    let scalePower = (dist, n): t => FromDist(#ToDist(Scale(#Power, n)), dist)
    let scaleLogarithm = (dist, n): t => FromDist(#ToDist(Scale(#Logarithm, n)), dist)
    let scaleLogarithmWithThreshold = (dist, n, eps): t => FromDist(
      #ToDist(Scale(#LogarithmWithThreshold(eps), n)),
      dist,
    )
    let toString = (dist): t => FromDist(#ToString(ToString), dist)
    let toSparkline = (dist, n): t => FromDist(#ToString(ToSparkline(n)), dist)
    let algebraicAdd = (dist1, dist2: genericDist): t => FromDist(
      #ToDistCombination(Algebraic(AsDefault), #Add, #Dist(dist2)),
      dist1,
    )
    let algebraicMultiply = (dist1, dist2): t => FromDist(
      #ToDistCombination(Algebraic(AsDefault), #Multiply, #Dist(dist2)),
      dist1,
    )
    let algebraicDivide = (dist1, dist2): t => FromDist(
      #ToDistCombination(Algebraic(AsDefault), #Divide, #Dist(dist2)),
      dist1,
    )
    let algebraicSubtract = (dist1, dist2): t => FromDist(
      #ToDistCombination(Algebraic(AsDefault), #Subtract, #Dist(dist2)),
      dist1,
    )
    let algebraicLogarithm = (dist1, dist2): t => FromDist(
      #ToDistCombination(Algebraic(AsDefault), #Logarithm, #Dist(dist2)),
      dist1,
    )
    let algebraicPower = (dist1, dist2): t => FromDist(
      #ToDistCombination(Algebraic(AsDefault), #Power, #Dist(dist2)),
      dist1,
    )
    let pointwiseAdd = (dist1, dist2): t => FromDist(
      #ToDistCombination(Pointwise, #Add, #Dist(dist2)),
      dist1,
    )
    let pointwiseMultiply = (dist1, dist2): t => FromDist(
      #ToDistCombination(Pointwise, #Multiply, #Dist(dist2)),
      dist1,
    )
    let pointwiseDivide = (dist1, dist2): t => FromDist(
      #ToDistCombination(Pointwise, #Divide, #Dist(dist2)),
      dist1,
    )
    let pointwiseSubtract = (dist1, dist2): t => FromDist(
      #ToDistCombination(Pointwise, #Subtract, #Dist(dist2)),
      dist1,
    )
    let pointwiseLogarithm = (dist1, dist2): t => FromDist(
      #ToDistCombination(Pointwise, #Logarithm, #Dist(dist2)),
      dist1,
    )
    let pointwisePower = (dist1, dist2): t => FromDist(
      #ToDistCombination(Pointwise, #Power, #Dist(dist2)),
      dist1,
    )
  }
}
