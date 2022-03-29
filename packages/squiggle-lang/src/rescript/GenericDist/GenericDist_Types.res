type genericDist = [
  | #PointSet(PointSetTypes.pointSetDist)
  | #SampleSet(array<float>)
  | #Symbolic(SymbolicDistTypes.symbolicDist)
]

type error =
  | NotYetImplemented
  | ImpossiblePath
  | DistributionVerticalShiftIsInvalid
  | Other(string)

module Operation = {
  type direction = [
    | #Algebraic
    | #Pointwise
  ]

  type arithmeticOperation = [
    | #Add
    | #Multiply
    | #Subtract
    | #Divide
    | #Exponentiate
    | #Log
  ]

  let arithmeticToFn = (arithmetic: arithmeticOperation) =>
    switch arithmetic {
    | #Add => \"+."
    | #Multiply => \"*."
    | #Subtract => \"-."
    | #Exponentiate => \"**"
    | #Divide => \"/."
    | #Log => (a, b) => log(a) /. log(b)
    }

  type toFloat = [
    | #Cdf(float)
    | #Inv(float)
    | #Mean
    | #Pdf(float)
    | #Sample
  ]

  type toDist = [
    | #normalize
    | #toPointSet
    | #toSampleSet(int)
    | #truncate(option<float>, option<float>)
    | #consoleLog
  ]

  type toFloatArray = [
    | #Sample(int)
  ]

  type fromDist = [
    | #toFloat(toFloat)
    | #toDist(toDist)
    | #toDistCombination(direction, arithmeticOperation, [#Dist(genericDist) | #Float(float)])
    | #toString
  ]

  type singleParamaterFunction = [
    | #fromDist(fromDist)
    | #fromFloat(fromDist)
  ]

  type genericFunctionCall = [
    | #fromDist(fromDist, genericDist)
    | #fromFloat(fromDist, float)
    | #mixture(array<(genericDist, float)>)
  ]

  let toString = (distFunction: fromDist): string =>
    switch distFunction {
    | #toFloat(#Cdf(r)) => `cdf(${E.Float.toFixed(r)})`
    | #toFloat(#Inv(r)) => `inv(${E.Float.toFixed(r)})`
    | #toFloat(#Mean) => `mean`
    | #toFloat(#Pdf(r)) => `pdf(${E.Float.toFixed(r)})`
    | #toFloat(#Sample) => `sample`
    | #toDist(#normalize) => `normalize`
    | #toDist(#toPointSet) => `toPointSet`
    | #toDist(#toSampleSet(r)) => `toSampleSet(${E.I.toString(r)})`
    | #toDist(#truncate(_, _)) => `truncate`
    | #toDist(#consoleLog) => `consoleLog`
    | #toString => `toString`
    | #toDistCombination(#Algebraic, _, _) => `algebraic`
    | #toDistCombination(#Pointwise, _, _) => `pointwise`
    }
}