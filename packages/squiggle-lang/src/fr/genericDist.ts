import {
  algebraicCumProd,
  algebraicCumSum,
  algebraicDiff,
  algebraicProduct,
  algebraicSum,
} from "../dist/distOperations/binaryOperations.js";
import {
  BinaryOperation,
  binaryOperations,
} from "../dist/distOperations/index.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { FRFunction } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frDistOrNumber,
  frNamed,
  frNumber,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import * as magicNumbers from "../magicNumbers.js";

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: false,
});

type OpPair = [string, BinaryOperation];
const algebraicOps: OpPair[] = [
  ["add", binaryOperations.algebraicAdd],
  ["multiply", binaryOperations.algebraicMultiply],
  ["subtract", binaryOperations.algebraicSubtract],
  ["divide", binaryOperations.algebraicDivide],
  ["pow", binaryOperations.algebraicPower],
  ["log", binaryOperations.algebraicLogarithm],
];
const pointwiseOps: OpPair[] = [
  ["dotAdd", binaryOperations.pointwiseAdd],
  ["dotMultiply", binaryOperations.pointwiseMultiply],
  ["dotSubtract", binaryOperations.pointwiseSubtract],
  ["dotDivide", binaryOperations.pointwiseDivide],
  ["dotPow", binaryOperations.pointwisePower],
];

const makeOperationFns = (): FRFunction[] => {
  const fns: FRFunction[] = [];

  function processPair([name, op]: OpPair, displaySection: string) {
    return maker.make({
      name,
      displaySection,
      definitions: [
        makeDefinition(
          [frDist, frNumber],
          frDist,
          ([dist, n], { environment }) =>
            unwrapDistResult(
              op(dist, new SymbolicDist.PointMass(n), { env: environment })
            )
        ),
        makeDefinition(
          [frNumber, frDist],
          frDist,
          ([n, dist], { environment }) =>
            unwrapDistResult(
              op(new SymbolicDist.PointMass(n), dist, { env: environment })
            )
        ),
        makeDefinition(
          [frDist, frDist],
          frDist,
          ([dist1, dist2], { environment }) =>
            unwrapDistResult(op(dist1, dist2, { env: environment }))
        ),
      ],
    });
  }

  for (const pair of [...algebraicOps]) {
    fns.push(processPair(pair, "Algebra"));
  }

  for (const pair of [...pointwiseOps]) {
    fns.push(processPair(pair, "Pointwise Algebra"));
  }

  return fns;
};

export const library: FRFunction[] = [
  maker.make({
    name: "sparkline",
    displaySection: "Utility",
    description: `
Produce a sparkline of length n. For example, \`▁▁▁▁▁▂▄▆▇██▇▆▄▂▁▁▁▁▁\`. These can be useful for testing or quick text visualizations.`,
    definitions: [
      makeDefinition(
        [frDist, frOptional(frNumber)],
        frString,
        ([d, n], { environment }) =>
          unwrapDistResult(
            d.toSparkline(
              n || magicNumbers.Environment.sparklineLength,
              environment
            )
          )
      ),
    ],
  }),
  maker.d2n({
    name: "mean",
    displaySection: "Basic Functions",
    fn: (d) => d.mean(),
  }),
  maker.d2n({
    name: "median",
    displaySection: "Basic Functions",
    fn: (d) => d.inv(0.5),
  }),
  maker.d2n({
    name: "stdev",

    displaySection: "Basic Functions",
    fn: (d) => unwrapDistResult(d.stdev()),
  }),
  maker.d2n({
    name: "variance",
    displaySection: "Basic Functions",
    fn: (d) => unwrapDistResult(d.variance()),
  }),
  maker.d2n({
    name: "min",
    displaySection: "Basic Functions",
    fn: (d) => d.min(),
  }),
  maker.d2n({
    name: "max",
    displaySection: "Basic Functions",
    fn: (d) => d.max(),
  }),
  maker.d2n({
    name: "mode",
    displaySection: "Basic Functions",
    fn: (d) => unwrapDistResult(d.mode()),
  }),
  maker.d2n({
    name: "integralSum",
    displaySection: "Basic Functions",
    description: `Get the sum of the integral of a distribution. If the distribution is normalized, this will be 1.0. This is useful for understanding unnormalized distributions.`,
    fn: (d) => d.integralSum(),
  }),
  maker.d2n({
    name: "sample",
    displaySection: "Basic Functions",
    fn: (d) => d.sample(),
  }),
  maker.make({
    name: "sampleN",
    displaySection: "Basic Functions",
    definitions: [
      makeDefinition(
        [frDist, frNamed("n", frNumber)],
        frArray(frNumber),
        ([dist, n]) => {
          return dist.sampleN(n | 0);
        }
      ),
    ],
  }),
  maker.d2d({
    name: "exp",
    displaySection: "Basic Functions",
    fn: (dist, env) => {
      return unwrapDistResult(
        binaryOperations.algebraicPower(
          new SymbolicDist.PointMass(Math.E),
          dist,
          {
            env,
          }
        )
      );
    },
  }),
  maker.d2d({
    name: "normalize",
    displaySection: "Normalization",
    description: `Normalize a distribution. This means scaling it appropriately so that it's cumulative sum is equal to 1. This only impacts Point Set distributions, because those are the only ones that can be non-normlized.`,
    fn: (d) => d.normalize(),
  }),
  maker.d2b({
    name: "isNormalized",
    displaySection: "Normalization",
    description: `Check if a distribution is normalized. This only impacts Point Set distributions, because those are the only ones that can be non-normlized. Most distributions are typically normalized, but there are some commands that could produce non-normalized distributions.`,
    fn: (d) => d.isNormalized(),
  }),
  maker.d2d({
    name: "toPointSet",
    displaySection: "Basic Functions",
    fn: (d, env) => unwrapDistResult(d.toPointSetDist(env)),
  }),
  maker.dn2n({
    name: "cdf",
    displaySection: "Basic Functions",
    fn: (d, x) => d.cdf(x),
  }),
  maker.dn2n({
    name: "pdf",
    displaySection: "Basic Functions",
    fn: (d, x, env) => unwrapDistResult(d.pdf(x, { env })),
  }),
  maker.dn2n({
    name: "inv",
    displaySection: "Basic Functions",
    fn: (d, x) => d.inv(x),
  }),
  maker.dn2n({
    name: "quantile",
    displaySection: "Basic Functions",
    fn: (d, x) => d.inv(x),
  }),
  maker.make({
    name: "truncate",
    displaySection: "Basic Functions",
    description: `Truncates both the left side and the right side of a distribution.

Sample set distributions are truncated by filtering samples, but point set distributions are truncated using direct geometric manipulation. Uniform distributions are truncated symbolically. Symbolic but non-uniform distributions get converted to Point Set distributions.`,
    definitions: [
      makeDefinition(
        [frDist, frNamed("left", frNumber), frNamed("right", frNumber)],
        frDist,
        ([dist, left, right], { environment }) =>
          unwrapDistResult(dist.truncate(left, right, { env: environment }))
      ),
    ],
  }),
  maker.dn2d({
    name: "truncateLeft",
    displaySection: "Basic Functions",
    fn: (dist, x, env) =>
      unwrapDistResult(dist.truncate(x, undefined, { env })),
  }),
  maker.dn2d({
    name: "truncateRight",
    displaySection: "Basic Functions",
    fn: (dist, x, env) =>
      unwrapDistResult(dist.truncate(undefined, x, { env })),
  }),
  maker.make({
    name: "sum",
    displaySection: "Algebra",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frDist,
        ([dists], { environment }) =>
          unwrapDistResult(
            algebraicSum(dists.map(parseDistFromDistOrNumber), environment)
          )
      ),
    ],
  }),
  maker.make({
    name: "product",
    displaySection: "Algebra",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frDist,
        ([dists], { environment }) =>
          unwrapDistResult(
            algebraicProduct(dists.map(parseDistFromDistOrNumber), environment)
          )
      ),
    ],
  }),
  maker.make({
    name: "cumsum",
    displaySection: "Algebra",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frArray(frDist),
        ([dists], { environment }) =>
          unwrapDistResult(
            algebraicCumSum(dists.map(parseDistFromDistOrNumber), environment)
          )
      ),
    ],
  }),
  maker.make({
    name: "cumprod",
    displaySection: "Algebra",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frArray(frDist),
        ([dists], { environment }) =>
          unwrapDistResult(
            algebraicCumProd(dists.map(parseDistFromDistOrNumber), environment)
          )
      ),
    ],
  }),
  maker.make({
    name: "diff",
    displaySection: "Algebra",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frArray(frDist),
        ([dists], { environment }) =>
          unwrapDistResult(
            algebraicDiff(dists.map(parseDistFromDistOrNumber), environment)
          )
      ),
    ],
  }),
  maker.d2d({
    name: "log",
    displaySection: "Algebra",
    fn: (dist, env) =>
      unwrapDistResult(
        binaryOperations.algebraicLogarithm(
          dist,
          new SymbolicDist.PointMass(Math.E),
          { env }
        )
      ),
  }),
  maker.d2d({
    name: "log10",
    displaySection: "Algebra",
    fn: (dist, env) =>
      unwrapDistResult(
        binaryOperations.algebraicLogarithm(
          dist,
          new SymbolicDist.PointMass(10),
          {
            env,
          }
        )
      ),
  }),
  maker.d2d({
    name: "unaryMinus",
    displaySection: "Algebra",
    fn: (dist, env) =>
      unwrapDistResult(
        binaryOperations.algebraicMultiply(
          dist,
          new SymbolicDist.PointMass(-1),
          {
            env,
          }
        )
      ),
  }),
  maker.d2d({
    name: "dotExp",
    fn: (dist, env) =>
      unwrapDistResult(
        binaryOperations.pointwisePower(
          new SymbolicDist.PointMass(Math.E),
          dist,
          {
            env,
          }
        )
      ),
  }),
  ...makeOperationFns(),
];
