type genericDist =
  | PointSet(PointSetTypes.pointSetDist)
  | SampleSet(SampleSet.t)
  | Symbolic(SymbolicDistTypes.symbolicDist)

@genType
type error =
  | NotYetImplemented
  | Unreachable
  | DistributionVerticalShiftIsInvalid
  | Other(string)

module Operation = {
  type direction =
    | Algebraic
    | Pointwise

  type arithmeticOperation = [
    | #Add
    | #Multiply
    | #Subtract
    | #Divide
    | #Exponentiate
    | #Logarithm
  ]

  let arithmeticToFn = (arithmetic: arithmeticOperation) =>
    switch arithmetic {
    | #Add => \"+."
    | #Multiply => \"*."
    | #Subtract => \"-."
    | #Exponentiate => \"**"
    | #Divide => \"/."
    | #Logarithm => (a, b) => log(a) /. log(b)
    }

  type toFloat = [
    | #Cdf(float)
    | #Inv(float)
    | #Mean
    | #Pdf(float)
    | #Sample
  ]

  type pointsetXSelection = [#Linear | #ByWeight]

  type toDist =
    | Normalize
    | ToPointSet
    | ToSampleSet(int)
    | Truncate(option<float>, option<float>)
    | Inspect

  type toFloatArray = Sample(int)

  type toString =
    | ToString
    | ToSparkline(int)

  type fromDist =
    | ToFloat(toFloat)
    | ToDist(toDist)
    | ToDistCombination(direction, arithmeticOperation, [#Dist(genericDist) | #Float(float)])
    | ToString(toString)

  type singleParamaterFunction =
    | FromDist(fromDist)
    | FromFloat(fromDist)

  @genType
  type genericFunctionCallInfo =
    | FromDist(fromDist, genericDist)
    | FromFloat(fromDist, float)
    | Mixture(array<(genericDist, float)>)

  let distCallToString = (distFunction: fromDist): string =>
    switch distFunction {
    | ToFloat(#Cdf(r)) => `cdf(${E.Float.toFixed(r)})`
    | ToFloat(#Inv(r)) => `inv(${E.Float.toFixed(r)})`
    | ToFloat(#Mean) => `mean`
    | ToFloat(#Pdf(r)) => `pdf(${E.Float.toFixed(r)})`
    | ToFloat(#Sample) => `sample`
    | ToDist(Normalize) => `normalize`
    | ToDist(ToPointSet) => `toPointSet`
    | ToDist(ToSampleSet(r)) => `toSampleSet(${E.I.toString(r)})`
    | ToDist(Truncate(_, _)) => `truncate`
    | ToDist(Inspect) => `inspect`
    | ToString(ToString) => `toString`
    | ToString(ToSparkline(n)) => `toSparkline(${E.I.toString(n)})`
    | ToDistCombination(Algebraic, _, _) => `algebraic`
    | ToDistCombination(Pointwise, _, _) => `pointwise`
    }

  let toString = (d: genericFunctionCallInfo): string =>
    switch d {
    | FromDist(f, _) | FromFloat(f, _) => distCallToString(f)
    | Mixture(_) => `mixture`
    }
}

module Constructors = {
  type t = Operation.genericFunctionCallInfo

  module UsingDists = {
    let mean = (dist): t => FromDist(ToFloat(#Mean), dist)
    let sample = (dist): t => FromDist(ToFloat(#Mean), dist)
    let cdf = (dist, f): t => FromDist(ToFloat(#Cdf(f)), dist)
    let inv = (dist, f): t => FromDist(ToFloat(#Inv(f)), dist)
    let pdf = (dist, f): t => FromDist(ToFloat(#Pdf(f)), dist)
    let normalize = (dist): t => FromDist(ToDist(Normalize), dist)
    let toPointSet = (dist): t => FromDist(ToDist(ToPointSet), dist)
    let toSampleSet = (dist, r): t => FromDist(ToDist(ToSampleSet(r)), dist)
    let truncate = (dist, left, right): t => FromDist(ToDist(Truncate(left, right)), dist)
    let inspect = (dist): t => FromDist(ToDist(Inspect), dist)
    let toString = (dist): t => FromDist(ToString(ToString), dist)
    let toSparkline = (dist, n): t => FromDist(ToString(ToSparkline(n)), dist)
    let algebraicAdd = (dist1, dist2: genericDist): t => FromDist(
      ToDistCombination(Algebraic, #Add, #Dist(dist2)),
      dist1,
    )
    let algebraicMultiply = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Multiply, #Dist(dist2)),
      dist1,
    )
    let algebraicDivide = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Divide, #Dist(dist2)),
      dist1,
    )
    let algebraicSubtract = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Subtract, #Dist(dist2)),
      dist1,
    )
    let algebraicLogarithm = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Logarithm, #Dist(dist2)),
      dist1,
    )
    let algebraicExponentiate = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Exponentiate, #Dist(dist2)),
      dist1,
    )
    let pointwiseAdd = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Add, #Dist(dist2)),
      dist1,
    )
    let pointwiseMultiply = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Multiply, #Dist(dist2)),
      dist1,
    )
    let pointwiseDivide = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Divide, #Dist(dist2)),
      dist1,
    )
    let pointwiseSubtract = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Subtract, #Dist(dist2)),
      dist1,
    )
    let pointwiseLogarithm = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Logarithm, #Dist(dist2)),
      dist1,
    )
    let pointwiseExponentiate = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Exponentiate, #Dist(dist2)),
      dist1,
    )
  }
}

module DistVariant = {
  type t =
    | Mean(genericDist)
    | Sample(genericDist)
    | Cdf(genericDist, float)
    | Inv(genericDist, float)
    | Pdf(genericDist, float)
    | Normalize(genericDist)
    | ToPointSet(genericDist)
    | ToSampleSet(genericDist, int)
    | Truncate(genericDist, option<float>, option<float>)
    | Inspect(genericDist)
    | ToString(genericDist)
    | ToSparkline(genericDist, int)
    | AlgebraicAdd(genericDist, genericDist)
    | AlgebraicMultiply(genericDist, genericDist)
    | AlgebraicDivide(genericDist, genericDist)
    | AlgebraicSubtract(genericDist, genericDist)
    | AlgebraicLogarithm(genericDist, genericDist)
    | AlgebraicExponentiate(genericDist, genericDist)
    | PointwiseAdd(genericDist, genericDist)
    | PointwiseMultiply(genericDist, genericDist)
    | PointwiseDivide(genericDist, genericDist)
    | PointwiseSubtract(genericDist, genericDist)
    | PointwiseLogarithm(genericDist, genericDist)
    | PointwiseExponentiate(genericDist, genericDist)
  
  let toGenericFunctionCallInfo = (t: t) =>
    switch t {
    | Mean(d) => Operation.FromDist(ToFloat(#Mean), d)
    | Sample(d) => FromDist(ToFloat(#Mean), d)
    | Cdf(d, f) => FromDist(ToFloat(#Cdf(f)), d)
    | Inv(d, f) => FromDist(ToFloat(#Inv(f)), d)
    | Pdf(d, f) => FromDist(ToFloat(#Pdf(f)), d)
    | Normalize(d) => FromDist(ToDist(Normalize), d)
    | ToPointSet(d) => FromDist(ToDist(ToPointSet), d)
    | ToSampleSet(d, r) => FromDist(ToDist(ToSampleSet(r)), d)
    | Truncate(d, left, right) => FromDist(ToDist(Truncate(left, right)), d)
    | Inspect(d) => FromDist(ToDist(Inspect), d)
    | ToString(d) => FromDist(ToString(ToString), d)
    | ToSparkline(d, n) => FromDist(ToString(ToSparkline(n)), d)
    | AlgebraicAdd(d1, d2) => FromDist(ToDistCombination(Algebraic, #Add, #Dist(d2)), d1)
    | AlgebraicMultiply(d1, d2) => FromDist(ToDistCombination(Algebraic, #Multiply, #Dist(d2)), d1)
    | AlgebraicDivide(d1, d2) => FromDist(ToDistCombination(Algebraic, #Divide, #Dist(d2)), d1)
    | AlgebraicSubtract(d1, d2) => FromDist(ToDistCombination(Algebraic, #Subtract, #Dist(d2)), d1)
    | AlgebraicLogarithm(d1, d2) =>
      FromDist(ToDistCombination(Algebraic, #Logarithm, #Dist(d2)), d1)
    | AlgebraicExponentiate(d1, d2) =>
      FromDist(ToDistCombination(Algebraic, #Exponentiate, #Dist(d2)), d1)
    | PointwiseAdd(d1, d2) => FromDist(ToDistCombination(Pointwise, #Add, #Dist(d2)), d1)
    | PointwiseMultiply(d1, d2) => FromDist(ToDistCombination(Pointwise, #Multiply, #Dist(d2)), d1)
    | PointwiseDivide(d1, d2) => FromDist(ToDistCombination(Pointwise, #Divide, #Dist(d2)), d1)
    | PointwiseSubtract(d1, d2) => FromDist(ToDistCombination(Pointwise, #Subtract, #Dist(d2)), d1)
    | PointwiseLogarithm(d1, d2) =>
      FromDist(ToDistCombination(Pointwise, #Logarithm, #Dist(d2)), d1)
    | PointwiseExponentiate(d1, d2) =>
      FromDist(ToDistCombination(Pointwise, #Exponentiate, #Dist(d2)), d1)
    }
}