// Types

let emptyXYShape: PointSetTypes.xyShape = {xs: [], ys: []}
exception LogicallyInconsistent(string)

// Helpers

let getArithmeticComplementOfDistributionForSubstraction = (
  dist: PointSetTypes.xyShape,
): PointSetTypes.xyShape => {
  let newXs = Belt.Array.map(dist.xs, x => -.x)
  {xs: newXs, ys: dist.ys}
}

let getApproximatePdfOfContinuousDistributionAtPoint = (
  dist: PointSetTypes.xyShape,
  point: float,
): float => {
  let closestFromBelowIndex = E.A.reducei(dist.xs, None, (accumulator, item, index) =>
    item < point ? Some(index) : accumulator
  ) // This could be improved by taking advantage of the fact that these are ordered
  let closestFromAboveIndexOption = Belt.Array.getIndexBy(dist.xs, item => item > point)

  let weightedMean = (
    point: float,
    closestFromBelow: float,
    closestFromAbove: float,
    valueclosestFromBelow,
    valueclosestFromAbove,
  ): float => {
    let distance = closestFromAbove -. closestFromBelow
    let w1 = (point -. closestFromBelow) /. distance
    let w2 = (closestFromAbove -. point) /. distance
    let result = w1 *. valueclosestFromAbove +. w2 *. valueclosestFromBelow
    result
  }

  let result = switch (closestFromBelowIndex, closestFromAboveIndexOption) {
  | (None, None) =>
    raise(
      LogicallyInconsistent(
        "Logically inconsistent option in NumericShapeCombination2.res. Possibly caused by empty distribution",
      ), // to do: give an error type
    ) // all are smaller, and all are larger
  | (None, Some(i)) => 0.0 // none are smaller, all are larger
  | (Some(i), None) => 0.0 // all are smaller, none are larger
  | (Some(i), Some(j)) => weightedMean(point, dist.xs[i], dist.xs[j], dist.ys[i], dist.ys[j]) // there is a lowerBound and an upperBound.
  }

  result
}

// Inner functions

let addContinuousContinuous = (
  s1: PointSetTypes.xyShape,
  s2: PointSetTypes.xyShape,
): PointSetTypes.xyShape => {
  // Assumption: xyShapes are ordered on the x coordinate.

  // Get some needed variables
  let len1 = XYShape.T.length(s1)
  let mins1xs = s1.xs[0] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a < b ? a : b)
  let maxs1xs = s1.xs[len1 - 1] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a > b ? a : b)

  let len2 = XYShape.T.length(s2)
  let mins2xs = s2.xs[0] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a < b ? a : b)
  let maxs2xs = s2.xs[len1 - 1] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a > b ? a : b)

  let lowerBound = mins1xs +. mins2xs
  let upperBound = maxs1xs +. maxs2xs
  let numIntervals = 2 * Js.Math.max_int(len1, len2) // 5000
  let epsilon = (upperBound -. lowerBound) /. Belt.Int.toFloat(numIntervals) // Js.Math.pow_float(~base=2.0, ~exp=-16.0)

  let newXs: array<float> = Belt.Array.makeUninitializedUnsafe(numIntervals)
  let newYs: array<float> = Belt.Array.makeUninitializedUnsafe(numIntervals)

  let getApproximatePdfOfS1AtPoint = x => getApproximatePdfOfContinuousDistributionAtPoint(s1, x)
  let getApproximatePdfOfS2AtPoint = x => getApproximatePdfOfContinuousDistributionAtPoint(s2, x)
  let float = x => Belt.Int.toFloat(x)
  // Compute the integral numerically.
  // I wouldn't worry too much about the O(n^3). At 5000 samples, this takes on the order of 25 million operations
  // The AMD Ryzen 7 processor in my computer can do around 300K million operations per second.
  // src: https://wikiless.org/wiki/Instructions_per_second?lang=en#Thousand_instructions_per_second_(TIPS/kIPS)
  for i in 0 to numIntervals - 1 {
    // where are the x points in the resulting distribution
    let z = lowerBound +. float(i) *. epsilon
    newXs[i] = z
    newYs[i] = 0.0
    for j in 0 to numIntervals - 1 {
      // how fine-grained do we want our approximation of the integral to be.
      let x = lowerBound +. float(j) *. epsilon
      let deltaYi = getApproximatePdfOfS1AtPoint(x) *. getApproximatePdfOfS2AtPoint(z -. x)
      newYs[i] = newYs[i] +. deltaYi
    }
  }
  // This could be improved by, for instance, choosing the location of the xs strategically
  // for example, such that each of them is "equidistant" in a cdf, that is, such that the
  // cdf increases by constant amounts from one point to another.
  {xs: newXs, ys: newYs}
}

let multiplyContinuousContinuous = (
  s1: PointSetTypes.xyShape,
  s2: PointSetTypes.xyShape,
): PointSetTypes.xyShape => {
  // Assumption: xyShapes are ordered on the x coordinate.

  // Get some needed variables
  let len1 = XYShape.T.length(s1)
  let mins1xs = s1.xs[0] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a < b ? a : b)
  let maxs1xs = s1.xs[len1 - 1] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a > b ? a : b)

  let len2 = XYShape.T.length(s2)
  let mins2xs = s2.xs[0] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a < b ? a : b)
  let maxs2xs = s2.xs[len1 - 1] // Belt.Array.reduce(s1.xs, s1.xs[0], (a, b) => a > b ? a : b)

  let lowerBound = mins1xs *. mins2xs
  let upperBound = maxs1xs *. maxs2xs
  let numIntervals = 2 * Js.Math.max_int(len1, len2) // 5000
  let epsilon = (upperBound -. lowerBound) /. Belt.Int.toFloat(numIntervals) // Js.Math.pow_float(~base=2.0, ~exp=-16.0)
  let epsilonForIgnoreInIntegral = Js.Math.pow_float(~base=2.0, ~exp=-16.0)

  let newXs: array<float> = Belt.Array.makeUninitializedUnsafe(numIntervals)
  let newYs: array<float> = Belt.Array.makeUninitializedUnsafe(numIntervals)

  let getApproximatePdfOfS1AtPoint = x => getApproximatePdfOfContinuousDistributionAtPoint(s1, x)
  let getApproximatePdfOfS2AtPoint = x => getApproximatePdfOfContinuousDistributionAtPoint(s2, x)
  let float = x => Belt.Int.toFloat(x)
  // Compute the integral numerically.
  // I wouldn't worry too much about the O(n^3). At 5000 samples, this takes on the order of 25 million operations
  // The AMD Ryzen 7 processor in my computer can do around 300K million operations per second.
  // src: https://wikiless.org/wiki/Instructions_per_second?lang=en#Thousand_instructions_per_second_(TIPS/kIPS)
  for i in 0 to numIntervals - 1 {
    // where are the x points in the resulting distribution
    let z = lowerBound +. float(i) *. epsilon
    newXs[i] = z
    newYs[i] = 0.0
    for j in 0 to numIntervals - 1 {
      // how fine-grained do we want our approximation of the integral to be.
      let x = lowerBound +. float(j) *. epsilon
      let absX = Js.Math.abs_float(x)
      if absX > epsilonForIgnoreInIntegral {
        let deltaYi =
          getApproximatePdfOfS1AtPoint(x) *. getApproximatePdfOfS2AtPoint(z /. x) *. (1 /. x)
        newYs[i] = newYs[i] +. deltaYi
      }
    }
  }
  // This could be improved by, for instance, choosing the location of the xs strategically
  // for example, such that each of them is "equidistant" in a cdf, that is, such that the
  // cdf increases by constant amounts from one point to another.
  {xs: newXs, ys: newYs}
}

// Main function

let combineShapesContinuousContinuous = (
  op: Operation.algebraicOperation,
  s1: PointSetTypes.xyShape,
  s2: PointSetTypes.xyShape,
): PointSetTypes.xyShape => {
  let result = switch op {
  | #Add => addContinuousContinuous(s1, s2)
  | #Subtract =>
    addContinuousContinuous(s1, getArithmeticComplementOfDistributionForSubstraction(s2))
  | #Multiply => emptyXYShape
  | #Divide => emptyXYShape
  | #Power => emptyXYShape
  | #Logarithm => emptyXYShape
  }
  result
}

// Not sure I understand how to combine continuous and discrete distribution

let combineShapesContinuousDiscrete = (
  op: Operation.algebraicOperation,
  continuousShape: PointSetTypes.xyShape,
  discreteShape: PointSetTypes.xyShape,
): PointSetTypes.xyShape => emptyXYShape

let combineShapesDiscreteContinuous = (
  op: Operation.algebraicOperation,
  discreteShape: PointSetTypes.xyShape,
  continuousShape: PointSetTypes.xyShape,
): PointSetTypes.xyShape => emptyXYShape
