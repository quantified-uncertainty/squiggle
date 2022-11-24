import * as Continuous from "./Continuous";
import { ContinuousShape } from "./Continuous";
import * as Discrete from "./Discrete";
import { DiscreteShape } from "./Discrete";
import * as Mixed from "./Mixed";
import * as magicNumbers from "../magicNumbers";
import * as RSResult from "../rsResult";
import * as Sparklines from "./Sparklines";
import { MixedShape } from "./Mixed";
import { ConvolutionOperation, PointSet } from "./types";

export type PointSetDist =
  | {
      type: "Continuous";
      value: ContinuousShape;
    }
  | {
      type: "Discrete";
      value: DiscreteShape;
    }
  | {
      type: "Mixed";
      value: MixedShape;
    };

const mapToAll = <T>(
  [fn1, fn2, fn3]: [
    (t: MixedShape) => T,
    (t: DiscreteShape) => T,
    (t: ContinuousShape) => T
  ],
  t: PointSetDist
): T => {
  switch (t.type) {
    case "Mixed":
      return fn1(t.value);
    case "Discrete":
      return fn2(t.value);
    case "Continuous":
      return fn3(t.value);
    default:
      throw new Error("Internal error, unknown PointSetDist type");
  }
};

const fmap = (
  t: PointSetDist,
  [fn1, fn2, fn3]: [
    (t: MixedShape) => MixedShape,
    (t: DiscreteShape) => DiscreteShape,
    (t: ContinuousShape) => ContinuousShape
  ]
): PointSetDist => {
  switch (t.type) {
    case "Mixed":
      return makeMixed(fn1(t.value));
    case "Discrete":
      return makeDiscrete(fn2(t.value));
    case "Continuous":
      return makeContinuous(fn3(t.value));
    default:
      throw new Error("Internal error, unknown PointSetDist type");
  }
};

const fmapResult = <E>(
  t: PointSetDist,
  [fn1, fn2, fn3]: [
    (t: MixedShape) => RSResult.rsResult<MixedShape, E>,
    (t: DiscreteShape) => RSResult.rsResult<DiscreteShape, E>,
    (t: ContinuousShape) => RSResult.rsResult<ContinuousShape, E>
  ]
): RSResult.rsResult<PointSetDist, E> => {
  switch (t.type) {
    case "Mixed":
      return RSResult.fmap(fn1(t.value), (x) => makeMixed(x));
    case "Discrete":
      return RSResult.fmap(fn2(t.value), (x) => makeDiscrete(x));
    case "Continuous":
      return RSResult.fmap(fn3(t.value), (x) => makeContinuous(x));
    default:
      throw new Error("Internal error, unknown PointSetDist type");
  }
};

//TODO WARNING: The combineAlgebraicallyWithDiscrete will break for subtraction and division, like, discrete - continous
export const combineAlgebraically = (
  op: ConvolutionOperation,
  t1: PointSetDist,
  t2: PointSetDist
): PointSetDist => {
  if (t1.type === "Continuous" && t2.type === "Continuous") {
    return makeContinuous(
      Continuous.combineAlgebraically(op, t1.value, t2.value)
    );
  } else if (t1.type === "Discrete" && t2.type === "Continuous") {
    return makeContinuous(
      Continuous.combineAlgebraicallyWithDiscrete(
        op,
        t2.value,
        t1.value,
        "First"
      )
    );
  } else if (t1.type === "Continuous" && t2.type === "Discrete") {
    return makeContinuous(
      Continuous.combineAlgebraicallyWithDiscrete(
        op,
        t1.value,
        t2.value,
        "Second"
      )
    );
  } else if (t1.type === "Discrete" && t2.type === "Discrete") {
    return makeDiscrete(Discrete.combineAlgebraically(op, t1.value, t2.value));
  } else {
    return makeMixed(
      Mixed.combineAlgebraically(op, T.toMixed(t1), T.toMixed(t2))
    );
  }
};

export const combinePointwise = <E>(
  t1: PointSetDist,
  t2: PointSetDist,
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    s1: ContinuousShape,
    s2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): RSResult.rsResult<PointSetDist, E> => {
  if (t1.type === "Continuous" && t2.type === "Continuous") {
    return RSResult.fmap(
      Continuous.combinePointwise(
        t1.value,
        t2.value,
        fn,
        undefined,
        integralSumCachesFn
      ),
      (x) => makeContinuous(x)
    );
  } else if (t1.type === "Discrete" && t2.type === "Discrete") {
    return RSResult.fmap(
      Discrete.combinePointwise(t1.value, t2.value, fn, integralSumCachesFn),
      (x) => makeDiscrete(x)
    );
  } else {
    return RSResult.fmap(
      Mixed.combinePointwise(
        T.toMixed(t1),
        T.toMixed(t2),
        fn,
        integralSumCachesFn,
        integralCachesFn
      ),
      (x) => makeMixed(x)
    );
  }
};

export const T: PointSet<PointSetDist> = {
  xToY(x, t) {
    return mapToAll(
      [
        (s) => Mixed.T.xToY(x, s),
        (s) => Discrete.T.xToY(x, s),
        (s) => Continuous.T.xToY(x, s),
      ],
      t
    );
  },
  downsample(i, t) {
    return fmap(t, [
      (s) => Mixed.T.downsample(i, s),
      (s) => Discrete.T.downsample(i, s),
      (s) => Continuous.T.downsample(i, s),
    ]);
  },
  truncate(leftCutoff, rightCutoff, t) {
    return fmap(t, [
      (s) => Mixed.T.truncate(leftCutoff, rightCutoff, s),
      (s) => Discrete.T.truncate(leftCutoff, rightCutoff, s),
      (s) => Continuous.T.truncate(leftCutoff, rightCutoff, s),
    ]);
  },
  normalize(t) {
    return fmap(t, [
      Mixed.T.normalize,
      Discrete.T.normalize,
      Continuous.T.normalize,
    ]);
  },
  updateIntegralCache(t, cache) {
    return fmap(t, [
      (s) => Mixed.T.updateIntegralCache(s, cache),
      (s) => Discrete.T.updateIntegralCache(s, cache),
      (s) => Continuous.T.updateIntegralCache(s, cache),
    ]);
  },
  toContinuous(t) {
    return mapToAll(
      [
        Mixed.T.toContinuous,
        Discrete.T.toContinuous,
        Continuous.T.toContinuous,
      ],
      t
    );
  },
  toDiscrete(t) {
    return mapToAll(
      [Mixed.T.toDiscrete, Discrete.T.toDiscrete, Continuous.T.toDiscrete],
      t
    );
  },
  toMixed(t) {
    return mapToAll(
      [Mixed.T.toMixed, Discrete.T.toMixed, Continuous.T.toMixed],
      t
    );
  },

  toDiscreteProbabilityMassFraction(t) {
    return mapToAll(
      [
        Mixed.T.toDiscreteProbabilityMassFraction,
        Discrete.T.toDiscreteProbabilityMassFraction,
        Continuous.T.toDiscreteProbabilityMassFraction,
      ],
      t
    );
  },
  integral(t) {
    return mapToAll(
      [Mixed.T.integral, Discrete.T.integral, Continuous.T.integral],
      t
    );
  },
  integralEndY(t) {
    return mapToAll(
      [
        Mixed.T.integralEndY,
        Discrete.T.integralEndY,
        Continuous.T.integralEndY,
      ],
      t
    );
  },
  integralXtoY(y, f) {
    return mapToAll(
      [
        (s) => Mixed.T.integralXtoY(y, s),
        (s) => Discrete.T.integralXtoY(y, s),
        (s) => Continuous.T.integralXtoY(y, s),
      ],
      f
    );
  },
  integralYtoX(y, f) {
    return mapToAll(
      [
        (s) => Mixed.T.integralYtoX(y, s),
        (s) => Discrete.T.integralYtoX(y, s),
        (s) => Continuous.T.integralYtoX(y, s),
      ],
      f
    );
  },
  minX(t) {
    return mapToAll([Mixed.T.minX, Discrete.T.minX, Continuous.T.minX], t);
  },
  maxX(t) {
    return mapToAll([Mixed.T.maxX, Discrete.T.maxX, Continuous.T.maxX], t);
  },
  mapY(t, fn, integralSumCacheFn, integralCacheFn) {
    return fmap(t, [
      (s) => Mixed.T.mapY(s, fn, integralSumCacheFn, integralCacheFn),
      (s) => Discrete.T.mapY(s, fn, integralSumCacheFn, integralCacheFn),
      (s) => Continuous.T.mapY(s, fn, integralSumCacheFn, integralCacheFn),
    ]);
  },
  mapYResult(
    t,
    fn,
    integralSumCacheFn = () => undefined,
    integralCacheFn = () => undefined
  ) {
    return fmapResult(t, [
      (s) => Mixed.T.mapYResult(s, fn, integralSumCacheFn, integralCacheFn),
      (s) => Discrete.T.mapYResult(s, fn, integralSumCacheFn, integralCacheFn),
      (s) =>
        Continuous.T.mapYResult(s, fn, integralSumCacheFn, integralCacheFn),
    ]);
  },
  mean(t) {
    return mapToAll([Mixed.T.mean, Discrete.T.mean, Continuous.T.mean], t);
  },
  variance(t) {
    return mapToAll(
      [Mixed.T.variance, Discrete.T.variance, Continuous.T.variance],
      t
    );
  },
};

export const pdf = (f: number, t: PointSetDist) => {
  const mixedPoint = T.xToY(f, t);
  return mixedPoint.continuous + mixedPoint.discrete;
};

export const inv = T.integralYtoX;
export const cdf = T.integralXtoY;

export const sample = (t: PointSetDist): number => {
  let randomItem = Math.random();
  return T.integralYtoX(randomItem, t);
};

// let isFloat = (t: t) =>
//   switch t {
//   | Discrete(d) => Discrete.isFloat(d)
//   | _ => false
//   }

export const sampleNRendered = (dist: PointSetDist, n: number): number[] => {
  const integralCache = T.integral(dist);
  const distWithUpdatedIntegralCache = T.updateIntegralCache(
    dist,
    integralCache
  );
  const items: number[] = new Array(n).fill(0);
  for (let i = 0; i <= n - 1; i++) {
    items[i] = sample(distWithUpdatedIntegralCache);
  }
  return items;
};

export const toSparkline = (
  t: PointSetDist,
  bucketCount: number
): RSResult.rsResult<string, string> => {
  const continuous = T.toContinuous(t);
  if (!continuous) {
    return RSResult.Error(
      "Cannot find the sparkline of a discrete distribution"
    );
  }
  const downsampled = Continuous.downsampleEquallyOverX(
    bucketCount,
    continuous
  );
  return RSResult.Ok(Sparklines.create(Continuous.getShape(downsampled).ys));
};

export const makeDiscrete = (d: DiscreteShape): PointSetDist => ({
  type: "Discrete",
  value: d,
});
export const makeContinuous = (d: ContinuousShape): PointSetDist => ({
  type: "Continuous",
  value: d,
});
export const makeMixed = (d: MixedShape): PointSetDist => ({
  type: "Mixed",
  value: d,
});

export const isContinuous = (d: PointSetDist) => d.type === "Continuous";
export const isDiscrete = (d: PointSetDist) => d.type === "Discrete";

export const expectedConvolutionCost = (d: PointSetDist): number => {
  switch (d.type) {
    case "Continuous":
      return magicNumbers.OpCost.continuousCost;
    case "Mixed":
      return magicNumbers.OpCost.mixedCost;
    case "Discrete":
      return d.value.xyShape.xs.length;
    default:
      throw new Error("Impossible");
  }
};
