module type dist = {
  type t
  type integral
  let minX: t => float
  let maxX: t => float
  let mapY: (
    ~integralSumCacheFn: float => option<float>=?,
    ~integralCacheFn: PointSetTypes.continuousShape => option<PointSetTypes.continuousShape>=?,
    t,
    float => float,
  ) => t
  let mapYResult: (
    ~integralSumCacheFn: float => option<float>=?,
    ~integralCacheFn: PointSetTypes.continuousShape => option<PointSetTypes.continuousShape>=?,
    t,
    float => result<float, 'e>,
  ) => result<t, 'e>
  let xToY: (float, t) => PointSetTypes.mixedPoint
  let toPointSetDist: t => PointSetTypes.pointSetDist
  let toContinuous: t => option<PointSetTypes.continuousShape>
  let toDiscrete: t => option<PointSetTypes.discreteShape>
  let normalize: t => t
  let toDiscreteProbabilityMassFraction: t => float
  let downsample: (int, t) => t
  let truncate: (option<float>, option<float>, t) => t

  let updateIntegralCache: (t, option<PointSetTypes.continuousShape>) => t

  let integral: t => integral
  let integralEndY: t => float
  let integralXtoY: (float, t) => float
  let integralYtoX: (float, t) => float

  let mean: t => float
  let variance: t => float
}

module Dist = (T: dist) => {
  type t = T.t
  type integral = T.integral
  let minX = T.minX
  let maxX = T.maxX
  let integral = T.integral
  let xTotalRange = (t: t) => maxX(t) -. minX(t)
  let mapY = T.mapY
  let mapYResult = T.mapYResult
  let xToY = T.xToY
  let downsample = T.downsample
  let toPointSetDist = T.toPointSetDist
  let toDiscreteProbabilityMassFraction = T.toDiscreteProbabilityMassFraction
  let toContinuous = T.toContinuous
  let toDiscrete = T.toDiscrete
  let normalize = T.normalize
  let truncate = T.truncate
  let mean = T.mean
  let variance = T.variance
  let integralEndY = T.integralEndY
  let updateIntegralCache = T.updateIntegralCache

  module Integral = {
    type t = T.integral
    let get = T.integral
    let xToY = T.integralXtoY
    let yToX = T.integralYtoX
    let sum = T.integralEndY
  }
}

module Common = {
  let combineIntegralSums = (
    combineFn: (float, float) => option<float>,
    t1IntegralSumCache: option<float>,
    t2IntegralSumCache: option<float>,
  ) =>
    switch (t1IntegralSumCache, t2IntegralSumCache) {
    | (None, _)
    | (_, None) =>
      None
    | (Some(s1), Some(s2)) => combineFn(s1, s2)
    }

  let combineIntegrals = (
    combineFn: (
      PointSetTypes.continuousShape,
      PointSetTypes.continuousShape,
    ) => option<PointSetTypes.continuousShape>,
    t1IntegralCache: option<PointSetTypes.continuousShape>,
    t2IntegralCache: option<PointSetTypes.continuousShape>,
  ) =>
    switch (t1IntegralCache, t2IntegralCache) {
    | (None, _)
    | (_, None) =>
      None
    | (Some(s1), Some(s2)) => combineFn(s1, s2)
    }
}
