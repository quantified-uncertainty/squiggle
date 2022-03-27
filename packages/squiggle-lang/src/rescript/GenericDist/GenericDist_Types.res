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
  ]

  type toFloatArray = [
    | #Sample(int)
  ]

  type t = [
    | #toFloat(toFloat)
    | #toDist(toDist)
    | #toDistCombination(direction, arithmeticOperation, [#Dist(genericDist) | #Float(float)])
    | #toString
  ]
}