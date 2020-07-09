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
    d => Mixed.make(~discrete=d, ~continuous=Continuous.empty),
    c => Mixed.make(~discrete=Discrete.empty, ~continuous=c),
  ));

let combineAlgebraically =
    (op: ExpressionTypes.algebraicOperation, t1: t, t2: t): t => {
  switch (t1, t2) {
  | (Continuous(m1), Continuous(m2)) =>
    DistTypes.Continuous(
      Continuous.combineAlgebraically(op, m1, m2),
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
    (~knownIntegralSumsFn=(_, _) => None, fn, t1: t, t2: t) =>
  switch (t1, t2) {
  | (Continuous(m1), Continuous(m2)) =>
    DistTypes.Continuous(
      Continuous.combinePointwise(~knownIntegralSumsFn, fn, m1, m2),
    )
  | (Discrete(m1), Discrete(m2)) =>
    DistTypes.Discrete(
      Discrete.combinePointwise(~knownIntegralSumsFn, fn, m1, m2),
    )
  | (m1, m2) =>
    DistTypes.Mixed(
      Mixed.combinePointwise(
        ~knownIntegralSumsFn,
        fn,
        toMixed(m1),
        toMixed(m2),
      ),
    )
  };

// TODO: implement these functions
let pdf = (f: float, t: t): float => {
  0.0;
};

let inv = (f: float, t: t): float => {
  0.0;
};

let sample = (t: t): float => {
  0.0;
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

    let downsample = (~cache=None, i, t) =>
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
      fmap((Mixed.T.normalize, Discrete.T.normalize, Continuous.T.normalize));
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
    let integral = (~cache) =>
      mapToAll((
        Mixed.T.Integral.get(~cache=None),
        Discrete.T.Integral.get(~cache=None),
        Continuous.T.Integral.get(~cache=None),
      ));
    let integralEndY = (~cache) =>
      mapToAll((
        Mixed.T.Integral.sum(~cache=None),
        Discrete.T.Integral.sum(~cache),
        Continuous.T.Integral.sum(~cache=None),
      ));
    let integralXtoY = (~cache, f) => {
      mapToAll((
        Mixed.T.Integral.xToY(~cache, f),
        Discrete.T.Integral.xToY(~cache, f),
        Continuous.T.Integral.xToY(~cache, f),
      ));
    };
    let integralYtoX = (~cache, f) => {
      mapToAll((
        Mixed.T.Integral.yToX(~cache, f),
        Discrete.T.Integral.yToX(~cache, f),
        Continuous.T.Integral.yToX(~cache, f),
      ));
    };
    let maxX = mapToAll((Mixed.T.maxX, Discrete.T.maxX, Continuous.T.maxX));
    let mapY = (~knownIntegralSumFn=previousIntegralSum => None, fn) =>
      fmap((
        Mixed.T.mapY(~knownIntegralSumFn, fn),
        Discrete.T.mapY(~knownIntegralSumFn, fn),
        Continuous.T.mapY(~knownIntegralSumFn, fn),
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

let operate = (distToFloatOp: ExpressionTypes.distToFloatOperation, s) =>
  switch (distToFloatOp) {
  | `Pdf(f) => pdf(f, s)
  | `Inv(f) => inv(f, s)
  | `Sample => sample(s)
  | `Mean => T.mean(s)
  };
