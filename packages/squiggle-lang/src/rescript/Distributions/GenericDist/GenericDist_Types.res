type genericDist =
  | PointSet(PointSetTypes.pointSetDist)
  | SampleSet(SampleSetDist.t)
  | Symbolic(SymbolicDistTypes.symbolicDist)

@genType
type error =
  | NotYetImplemented
  | Unreachable
  | DistributionVerticalShiftIsInvalid
  | ArgumentError(string)
  | Other(string)

@genType
module Error = {
  type t = error

  let fromString = (s: string): t => Other(s)

  @genType
  let toString = (x: t) => {
    switch x {
    | NotYetImplemented => "Not Yet Implemented"
    | Unreachable => "Unreachable"
    | DistributionVerticalShiftIsInvalid => "Distribution Vertical Shift Is Invalid"
    | Other(s) => s
    }
  }

  let resultStringToResultError: result<'a, string> => result<'a, error> = n =>
    n->E.R2.errMap(r => r->fromString->Error)
}

module Operation = {
  type direction =
    | Algebraic
    | Pointwise

  type arithmeticOperation = [
    | #Add
    | #Multiply
    | #Subtract
    | #Divide
    | #Power
    | #Logarithm
  ]

  let arithmeticToFn = (arithmetic: arithmeticOperation) =>
    switch arithmetic {
    | #Add => \"+."
    | #Multiply => \"*."
    | #Subtract => \"-."
    | #Power => \"**"
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

  @genType
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

/*
It can be a pain to write out the genericFunctionCallInfo. The constructors help with this. 
This code only covers some of genericFunctionCallInfo: many arguments could be called with either a
float or a distribution. The "UsingDists" module assumes that everything is a distribution.
This is a tradeoff of some generality in order to get a bit more simplicity.
I could see having a longer interface in the future, but it could be messy.
Like, algebraicAddDistFloat vs. algebraicAddDistDist
*/
module Constructors = {
  type t = Operation.genericFunctionCallInfo

  module UsingDists = {
    @genType
    let mean = (dist): t => FromDist(ToFloat(#Mean), dist)
    let sample = (dist): t => FromDist(ToFloat(#Sample), dist)
    let cdf = (dist, x): t => FromDist(ToFloat(#Cdf(x)), dist)
    let inv = (dist, x): t => FromDist(ToFloat(#Inv(x)), dist)
    let pdf = (dist, x): t => FromDist(ToFloat(#Pdf(x)), dist)
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
    let algebraicPower = (dist1, dist2): t => FromDist(
      ToDistCombination(Algebraic, #Power, #Dist(dist2)),
      dist1,
    )
    let pointwiseAdd = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Add, #Dist(dist2)),
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
    let pointwisePower = (dist1, dist2): t => FromDist(
      ToDistCombination(Pointwise, #Power, #Dist(dist2)),
      dist1,
    )
  }
}
