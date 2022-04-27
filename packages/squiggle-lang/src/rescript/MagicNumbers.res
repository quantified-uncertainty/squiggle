module Math = {
  let e = Js.Math._E
  let pi = Js.Math._PI
}

module Epsilon = {
  let ten = 1e-10
  let seven = 1e-7
}

module Environment = {
  let defaultXYPointLength = 1000
  let defaultSampleCount = 10000
}

module OpCost = {
  let floatCost = 1
  let symbolicCost = 1000
  // Discrete cost is the length of the xyShape
  let mixedCost = 1000
  let continuousCost = 1000
  let wildcardCost = 1000
  let monteCarloCost = Environment.defaultSampleCount
}
