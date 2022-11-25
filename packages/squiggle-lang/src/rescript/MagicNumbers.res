module Math = {
  let e = Js.Math._E
  let pi = Js.Math._PI
}

module Epsilon = {
  let ten = 1e-10
  let five = 1e-5
}

module Environment = {
  let defaultXYPointLength = 1000
  let defaultSampleCount = 10000
  let sparklineLength = 20
}

module OpCost = {
  let wildcardCost = 1000
  let monteCarloCost = Environment.defaultSampleCount
}
