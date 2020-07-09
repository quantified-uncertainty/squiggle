module type dist = {
  type t;
  type integral;
  let minX: t => float;
  let maxX: t => float;
  let mapY:
    (~knownIntegralSumFn: float => option(float)=?, float => float, t) => t;
  let xToY: (float, t) => DistTypes.mixedPoint;
  let toShape: t => DistTypes.shape;
  let toContinuous: t => option(DistTypes.continuousShape);
  let toDiscrete: t => option(DistTypes.discreteShape);
  let normalize: t => t;
  let normalizedToContinuous: t => option(DistTypes.continuousShape);
  let normalizedToDiscrete: t => option(DistTypes.discreteShape);
  let toDiscreteProbabilityMassFraction: t => float;
  let downsample: (~cache: option(integral)=?, int, t) => t;
  let truncate: (option(float), option(float), t) => t;

  let integral: (~cache: option(integral), t) => integral;
  let integralEndY: (~cache: option(integral), t) => float;
  let integralXtoY: (~cache: option(integral), float, t) => float;
  let integralYtoX: (~cache: option(integral), float, t) => float;

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
        t1KnownIntegralSum: option(float),
        t2KnownIntegralSum: option(float),
      ) => {
    switch (t1KnownIntegralSum, t2KnownIntegralSum) {
    | (None, _)
    | (_, None) => None
    | (Some(s1), Some(s2)) => combineFn(s1, s2)
    };
  };
};
