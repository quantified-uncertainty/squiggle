module type dist = {
  type t;
  type integral;
  let minX: t => float;
  let maxX: t => float;
  let mapY:
    (~integralSumCacheFn: float => option(float)=?, ~integralCacheFn: DistTypes.continuousShape => option(DistTypes.continuousShape)=?, float => float, t) => t;
  let xToY: (float, t) => DistTypes.mixedPoint;
  let toShape: t => DistTypes.shape;
  let toContinuous: t => option(DistTypes.continuousShape);
  let toDiscrete: t => option(DistTypes.discreteShape);
  let normalize: t => t;
  let normalizedToContinuous: t => option(DistTypes.continuousShape);
  let normalizedToDiscrete: t => option(DistTypes.discreteShape);
  let toDiscreteProbabilityMassFraction: t => float;
  let downsample: (int, t) => t;
  let truncate: (option(float), option(float), t) => t;

  let updateIntegralCache: (option(DistTypes.continuousShape), t) => t;

  let integral: (t) => integral;
  let integralEndY: (t) => float;
  let integralXtoY: (float, t) => float;
  let integralYtoX: (float, t) => float;

  let mean: t => float;
  let variance: t => float;
};

module Dist = (T: dist) => {
  type t = T.t;
  type integral = T.integral;
  let minX = T.minX;
  let maxX = T.maxX;
  let integral = T.integral;
  let xTotalRange = (t: t) => maxX(t) -. minX(t);
  let mapY = T.mapY;
  let xToY = T.xToY;
  let downsample = T.downsample;
  let toShape = T.toShape;
  let toDiscreteProbabilityMassFraction = T.toDiscreteProbabilityMassFraction;
  let toContinuous = T.toContinuous;
  let toDiscrete = T.toDiscrete;
  let normalize = T.normalize;
  let truncate = T.truncate;
  let normalizedToContinuous = T.normalizedToContinuous;
  let normalizedToDiscrete = T.normalizedToDiscrete;
  let mean = T.mean;
  let variance = T.variance;

  let updateIntegralCache = T.updateIntegralCache;

  module Integral = {
    type t = T.integral;
    let get = T.integral;
    let xToY = T.integralXtoY;
    let yToX = T.integralYtoX;
    let sum = T.integralEndY;
  };
};

module Common = {
  let combineIntegralSums =
      (
        combineFn: (float, float) => option(float),
        t1IntegralSumCache: option(float),
        t2IntegralSumCache: option(float),
      ) => {
    switch (t1IntegralSumCache, t2IntegralSumCache) {
    | (None, _)
    | (_, None) => None
    | (Some(s1), Some(s2)) => combineFn(s1, s2)
    };
  };

  let combineIntegrals =
      (
        combineFn: (DistTypes.continuousShape, DistTypes.continuousShape) => option(DistTypes.continuousShape),
        t1IntegralCache: option(DistTypes.continuousShape),
        t2IntegralCache: option(DistTypes.continuousShape),
      ) => {
    switch (t1IntegralCache, t2IntegralCache) {
    | (None, _)
    | (_, None) => None
    | (Some(s1), Some(s2)) => combineFn(s1, s2)
    };
  };
};
