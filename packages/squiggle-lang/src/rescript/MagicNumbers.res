module Math = {
  let e = Js.Math._E
  let pi = Js.Math._PI
}

module Epsilon = {
  let ten = 1e-10
  let seven = 1e-7
  let five = 1e-5
}

module Environment = {
  let defaultXYPointLength = 1000
  let defaultSampleCount = 10000
  let sparklineLength = 20
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

module ToPointSet = {
  /*
  This function chooses the minimum amount of duplicate samples that need
  to exist in order for this to be considered discrete. The tricky thing 
  is that there are some operations that create duplicate continuous samples, 
  so we can't guarantee that these only will occur because the fundamental 
  structure is meant to be discrete. I chose this heuristic because I think 
  it would strike a reasonable trade-off, but I’m really unsure what’s 
  best right now.
 */
  let minDiscreteToKeep = samples => max(20, E.A.length(samples) / 50)
}
