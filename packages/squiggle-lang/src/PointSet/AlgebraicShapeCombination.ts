import * as XYShape from "../XYShape.js";
import { ConvolutionOperation, convolutionOperationToFn } from "./PointSet.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";

type PointMassesWithMoments = {
  n: number;
  masses: number[];
  means: number[];
  variances: number[];
};

/* This function takes a continuous distribution and efficiently approximates it as
   point masses that have variances associated with them.
   We estimate the means and variances from overlapping triangular distributions which we imagine are making up the
   XYShape.
   We can then use the algebra of random variables to "convolve" the point masses and their variances,
   and finally reconstruct a new distribution from them, e.g. using a Fast Gauss Transform or Raykar et al. (2007). */
const toDiscretePointMassesFromTriangulars = (
  s: XYShape.XYShape,
  { inverse }: { inverse: boolean } = { inverse: false }
): PointMassesWithMoments => {
  // TODO: what if there is only one point in the distribution?
  let n = XYShape.T.length(s);
  // first, double up the leftmost and rightmost points:
  const { xs, ys } = s;
  // FIXME - danger, we shouldn't modify shapes
  xs.unshift(xs[0]);
  ys.unshift(ys[0]);
  xs.push(xs[n - 1]);
  ys.push(ys[n - 1]);
  n = xs.length;
  // squares and neighbourly products of the xs
  const xsSq: number[] = new Array(n);
  const xsProdN1: number[] = new Array(n - 1);
  const xsProdN2: number[] = new Array(n - 2);

  for (let i = 0; i <= n - 1; i++) {
    xsSq[i] = xs[i] * xs[i];
  }
  for (let i = 0; i <= n - 2; i++) {
    xsProdN1[i] = xs[i] * xs[i + 1];
  }
  for (let i = 0; i <= n - 3; i++) {
    xsProdN2[i] = xs[i] * xs[i + 2];
  }
  // means and variances
  const masses: number[] = new Array(n - 2); // doesn't include the fake first and last points
  const means: number[] = new Array(n - 2);
  const variances: number[] = new Array(n - 2);

  if (inverse) {
    for (let i = 1; i <= n - 2; i++) {
      masses[i - 1] = ((xs[i + 1] - xs[i - 1]) * ys[i]) / 2;

      // this only works when the whole triange is either on the left or on the right of zero
      const a = xs[i - 1];
      const c = xs[i];
      const b = xs[i + 1];

      // These are the moments of the reciprocal of a triangular distribution, as symbolically integrated by Mathematica.
      // They're probably pretty close to invMean ~ 1/mean = 3/(a+b+c) and invVar. But I haven't worked out
      // the worst case error, so for now let's use these monster equations
      const inverseMean =
        (2 *
          ((a * Math.log(a / c)) / (a - c) + (b * Math.log(c / b)) / (b - c))) /
        (a - b);
      const inverseVar =
        (2 * (Math.log(c / a) / (a - c) + (b * Math.log(b / c)) / (b - c))) /
          (a - b) -
        inverseMean ** 2;

      means[i - 1] = inverseMean;
      variances[i - 1] = inverseVar;
    }

    return { n: n - 2, masses, means, variances };
  } else {
    for (let i = 1; i <= n - 2; i++) {
      // area of triangle = width * height / 2
      masses[i - 1] = ((xs[i + 1] - xs[i - 1]) * ys[i]) / 2;

      // means of triangle = (a + b + c) / 3
      means[i - 1] = (xs[i - 1] + xs[i] + xs[i + 1]) / 3;

      // variance of triangle = (a^2 + b^2 + c^2 - ab - ac - bc) / 18
      variances[i - 1] =
        (xsSq[i - 1] +
          xsSq[i] +
          xsSq[i + 1] -
          xsProdN1[i - 1] -
          xsProdN1[i] -
          xsProdN2[i - 1]) /
        18;
    }
    return { n: n - 2, masses, means, variances };
  }
};

export const combineShapesContinuousContinuous = (
  op: ConvolutionOperation,
  s1: XYShape.XYShape,
  s2: XYShape.XYShape
): XYShape.XYShape => {
  // if we add the two distributions, we should probably use normal filters.
  // if we multiply the two distributions, we should probably use lognormal filters.
  const t1m = toDiscretePointMassesFromTriangulars(s1);
  const t2m = toDiscretePointMassesFromTriangulars(s2, { inverse: false });

  const combineMeansFn = {
    Add: (m1: number, m2: number) => m1 + m2,
    Subtract: (m1: number, m2: number) => m1 - m2,
    Multiply: (m1: number, m2: number) => m1 * m2,
  }[op];
  // note: here, mInv2 = mean(1 / t2) ~= 1 / mean(t2)

  const combineVariancesFn: (
    a: number,
    b: number,
    c: number,
    d: number
  ) => number = {
    Add: (v1: number, v2: number) => v1 + v2,
    Subtract: (v1: number, v2: number) => v1 + v2,
    Multiply: (v1: number, v2: number, m1: number, m2: number) =>
      v1 * v2 + v1 * m2 ** 2 + v2 * m1 ** 2,
  }[op];

  // TODO: If operating on two positive-domain distributions, we should take that into account
  let outputMinX = Infinity;
  let outputMaxX = -Infinity;
  const masses: number[] = new Array(t1m.n * t2m.n);
  const means: number[] = new Array(t1m.n * t2m.n);
  const variances: number[] = new Array(t1m.n * t2m.n);
  // then convolve the two sets of pointMassesWithMoments
  for (let i = 0; i < t1m.n; i++) {
    for (let j = 0; j < t2m.n; j++) {
      const k = i * t2m.n + j;
      masses[k] = t1m.masses[i] * t2m.masses[j];

      const mean = combineMeansFn(t1m.means[i], t2m.means[j]);
      const variance = combineVariancesFn(
        t1m.variances[i],
        t2m.variances[j],
        t1m.means[i],
        t2m.means[j]
      );
      means[k] = mean;
      variances[k] = variance;

      // update bounds
      const minX = mean - 2 * Math.sqrt(variance) * 1.644854;
      const maxX = mean + 2 * Math.sqrt(variance) * 1.644854;
      if (minX < outputMinX) {
        outputMinX = minX;
      }
      if (maxX > outputMaxX) {
        outputMaxX = maxX;
      }
    }
  }

  // we now want to create a set of target points. For now, let's just evenly distribute 200 points between
  // between the outputMinX and outputMaxX
  const nOut = 300;
  const outputXs = E_A_Floats.range(outputMinX, outputMaxX, nOut);
  const outputYs = new Array(nOut).fill(0);

  // now, for each of the outputYs, accumulate from a Gaussian kernel over each input point.
  for (let j = 0; j < masses.length; j++) {
    if (
      // go through all of the result points
      variances[j] > 0 &&
      masses[j] > 0
    ) {
      for (let i = 0; i < outputXs.length; i++) {
        // go through all of the target points
        const dx = outputXs[i] - means[j];
        const contribution =
          (masses[j] * Math.exp(-(dx ** 2) / (2 * variances[j]))) /
          Math.sqrt(2 * 3.14159276 * variances[j]);
        outputYs[i] = outputYs[i] + contribution;
      }
    }
  }

  return { xs: outputXs, ys: outputYs };
};

// const toDiscretePointMassesFromDiscrete = (
//   s: XYShape.XYShape
// ): PointMassesWithMoments => {
//   const { xs, ys } = s;
//   const n = xs.length;

//   const masses: number[] = [...ys];
//   const means: number[] = [...xs];
//   const variances: number[] = new Array(n).fill(0);

//   return { n, masses, means, variances };
// };

export type ArgumentPosition = "First" | "Second";

export const combineShapesContinuousDiscrete = (
  op: ConvolutionOperation,
  continuousShape: XYShape.XYShape,
  discreteShape: XYShape.XYShape,
  opts: { discretePosition: ArgumentPosition }
): XYShape.XYShape => {
  const t1n = XYShape.T.length(continuousShape);
  const t2n = XYShape.T.length(discreteShape);

  // each x pair is added/subtracted
  const opFunc = convolutionOperationToFn(op);
  const fn =
    opts.discretePosition === "First"
      ? (a: number, b: number) => opFunc(b, a)
      : opFunc;

  const outXYShapes: [number, number][][] = new Array(t2n);

  switch (op) {
    case "Add":
    case "Subtract":
      for (let j = 0; j <= t2n - 1; j++) {
        // creates a new continuous shape for each one of the discrete points, and collects them in outXYShapes.
        const dxyShape: [number, number][] = new Array(t1n);
        for (let i = 0; i <= t1n - 1; i++) {
          // When this operation is flipped (like 1 - normal(5, 2)) then the
          // x axis coordinates would all come out the wrong order. So we need
          // to fill them out in the opposite direction
          const index =
            opts.discretePosition === "First" && op === "Subtract"
              ? t1n - 1 - i
              : i;
          dxyShape[index] = [
            fn(continuousShape.xs[i], discreteShape.xs[j]),
            continuousShape.ys[i] * discreteShape.ys[j],
          ];
        }
        outXYShapes[j] = dxyShape;
      }
      break;
    case "Multiply":
      for (let j = 0; j <= t2n - 1; j++) {
        // creates a new continuous shape for each one of the discrete points, and collects them in outXYShapes.
        const dxyShape: [number, number][] = new Array(t1n);
        for (let i = 0; i <= t1n - 1; i++) {
          // If this operation would flip the x axis (such as -1 * normal(5, 2)),
          // then we want to fill the shape in backwards to ensure all the points
          // are still in the right order
          const index = discreteShape.xs[j] > 0 ? i : t1n - 1 - i;
          dxyShape[index] = [
            fn(continuousShape.xs[i], discreteShape.xs[j]),
            (continuousShape.ys[i] * discreteShape.ys[j]) /
              Math.abs(discreteShape.xs[j]),
          ];
        }
        outXYShapes[j] = dxyShape;
      }
      break;
    default:
      throw new Error(`Unknown operation ${op}`);
  }

  return outXYShapes
    .map(XYShape.T.fromZippedArray)
    .reduce(
      (acc, x) =>
        XYShape.PointwiseCombination.addCombine(
          XYShape.XtoY.continuousInterpolator("Linear", "UseZero"),
          acc,
          x
        ),
      XYShape.T.empty
    );
};

export const isOrdered = (a: XYShape.XYShape): boolean => {
  return E_A_Floats.isSorted(a.xs);
};
