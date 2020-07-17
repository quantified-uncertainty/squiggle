open Distributions;

type t = DistTypes.shape;
let mapToAll = ((fn1, fn2, fn3), t: t) =>
  switch (t) {
  | Mixed(m) => fn1(m)
  | Discrete(m) => fn2(m)
  | Continuous(m) => fn3(m)
  };

let fmap = ((fn1, fn2, fn3), t: t): t =>
  switch (t) {
  | Mixed(m) => Mixed(fn1(m))
  | Discrete(m) => Discrete(fn2(m))
  | Continuous(m) => Continuous(fn3(m))
  };


let toMixed =
  mapToAll((
    m => m,
    d => Mixed.make(~discrete=d, ~continuous=Continuous.empty, d.integralSumCache, d.integralCache),
    c => Mixed.make(~discrete=Discrete.empty, ~continuous=c, c.integralSumCache, c.integralCache),
  ));

let combineAlgebraically =
    (op: ExpressionTypes.algebraicOperation, t1: t, t2: t): t => {
  switch (t1, t2) {
  | (Continuous(m1), Continuous(m2)) =>
    DistTypes.Continuous(
      Continuous.combineAlgebraically(op, m1, m2),
    )
  | (Continuous(m1), Discrete(m2))
  | (Discrete(m2), Continuous(m1)) =>
    DistTypes.Continuous(
      Continuous.combineAlgebraicallyWithDiscrete(op, m1, m2),
    )
  | (Discrete(m1), Discrete(m2)) =>
    DistTypes.Discrete(Discrete.combineAlgebraically(op, m1, m2))
  | (m1, m2) =>
    DistTypes.Mixed(
      Mixed.combineAlgebraically(
        op,
        toMixed(m1),
        toMixed(m2),
      ),
    )
  };
};

let combinePointwise =
  (~integralSumCachesFn: (float, float) => option(float) = (_, _) => None,
   ~integralCachesFn: (DistTypes.continuousShape, DistTypes.continuousShape) => option(DistTypes.continuousShape) = (_, _) => None,
   fn,
   t1: t,
   t2: t) =>
  switch (t1, t2) {
  | (Continuous(m1), Continuous(m2)) =>
    DistTypes.Continuous(
      Continuous.combinePointwise(~integralSumCachesFn, ~integralCachesFn, fn, m1, m2),
    )
  | (Discrete(m1), Discrete(m2)) =>
    DistTypes.Discrete(
      Discrete.combinePointwise(~integralSumCachesFn, ~integralCachesFn, fn, m1, m2),
    )
  | (m1, m2) =>
    DistTypes.Mixed(
      Mixed.combinePointwise(
        ~integralSumCachesFn,
        ~integralCachesFn,
        fn,
        toMixed(m1),
        toMixed(m2),
      ),
    )
  };

module T =
  Dist({
    type t = DistTypes.shape;
    type integral = DistTypes.continuousShape;

    let xToY = (f: float) =>
      mapToAll((
        Mixed.T.xToY(f),
        Discrete.T.xToY(f),
        Continuous.T.xToY(f),
      ));

    let toShape = (t: t) => t;

    let toContinuous = t => None;
    let toDiscrete = t => None;

    let downsample = (i, t) =>
      fmap(
        (
          Mixed.T.downsample(i),
          Discrete.T.downsample(i),
          Continuous.T.downsample(i),
        ),
        t,
      );

    let truncate = (leftCutoff, rightCutoff, t): t =>
      fmap(
        (
          Mixed.T.truncate(leftCutoff, rightCutoff),
          Discrete.T.truncate(leftCutoff, rightCutoff),
          Continuous.T.truncate(leftCutoff, rightCutoff),
        ),
        t,
      );

    let toDiscreteProbabilityMassFraction = t => 0.0;

    let normalize =
      fmap((
        Mixed.T.normalize,
        Discrete.T.normalize,
        Continuous.T.normalize
      ));

    let toContinuous =
      mapToAll((
        Mixed.T.toContinuous,
        Discrete.T.toContinuous,
        Continuous.T.toContinuous,
      ));
    let toDiscrete =
      mapToAll((
        Mixed.T.toDiscrete,
        Discrete.T.toDiscrete,
        Continuous.T.toDiscrete,
      ));

    let toDiscreteProbabilityMassFraction =
      mapToAll((
        Mixed.T.toDiscreteProbabilityMassFraction,
        Discrete.T.toDiscreteProbabilityMassFraction,
        Continuous.T.toDiscreteProbabilityMassFraction,
      ));

    let normalizedToDiscrete =
      mapToAll((
        Mixed.T.normalizedToDiscrete,
        Discrete.T.normalizedToDiscrete,
        Continuous.T.normalizedToDiscrete,
      ));
    let normalizedToContinuous =
      mapToAll((
        Mixed.T.normalizedToContinuous,
        Discrete.T.normalizedToContinuous,
        Continuous.T.normalizedToContinuous,
      ));
    let minX = mapToAll((Mixed.T.minX, Discrete.T.minX, Continuous.T.minX));
    let integral =
      mapToAll((
        Mixed.T.Integral.get,
        Discrete.T.Integral.get,
        Continuous.T.Integral.get,
      ));
    let integralEndY =
      mapToAll((
        Mixed.T.Integral.sum,
        Discrete.T.Integral.sum,
        Continuous.T.Integral.sum,
      ));
    let integralXtoY = (f) => {
      mapToAll((
        Mixed.T.Integral.xToY(f),
        Discrete.T.Integral.xToY(f),
        Continuous.T.Integral.xToY(f),
      ));
    };
    let integralYtoX = (f) => {
      mapToAll((
        Mixed.T.Integral.yToX(f),
        Discrete.T.Integral.yToX(f),
        Continuous.T.Integral.yToX(f),
      ));
    };
    let maxX = mapToAll((Mixed.T.maxX, Discrete.T.maxX, Continuous.T.maxX));
    let mapY = (~integralSumCacheFn=previousIntegralSum => None, ~integralCacheFn=previousIntegral=>None, fn) =>
      fmap((
        Mixed.T.mapY(~integralSumCacheFn, ~integralCacheFn, fn),
        Discrete.T.mapY(~integralSumCacheFn, ~integralCacheFn, fn),
        Continuous.T.mapY(~integralSumCacheFn, ~integralCacheFn, fn),
      ));

    let mean = (t: t): float =>
      switch (t) {
      | Mixed(m) => Mixed.T.mean(m)
      | Discrete(m) => Discrete.T.mean(m)
      | Continuous(m) => Continuous.T.mean(m)
      };

    let variance = (t: t): float =>
      switch (t) {
      | Mixed(m) => Mixed.T.variance(m)
      | Discrete(m) => Discrete.T.variance(m)
      | Continuous(m) => Continuous.T.variance(m)
      };
  });

let pdf = (f: float, t: t) => {
  let mixedPoint: DistTypes.mixedPoint = T.xToY(f, t);
  mixedPoint.continuous +. mixedPoint.discrete;
};

let inv = T.Integral.yToX;
let cdf = T.Integral.xToY;

let sample = (t: t): float => {
  // this can go, already taken care of in Ozzie's sampling branch
  0.0
};

let operate = (distToFloatOp: ExpressionTypes.distToFloatOperation, s): float =>
  switch (distToFloatOp) {
  | `Pdf(f) => pdf(f, s)
  | `Cdf(f) => pdf(f, s)
  | `Inv(f) => inv(f, s)
  | `Sample => sample(s)
  | `Mean => T.mean(s)
  };
