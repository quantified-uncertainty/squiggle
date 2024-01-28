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
import { ReducerContext } from "../reducer/context.js";

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

function contextToOpts(
  context: ReducerContext
): Parameters<BinaryOperation>[2] {
  return {
    env: context.environment,
    rng: context.rng,
  };
}

const makeOperationFns = (): FRFunction[] => {
  const fns: FRFunction[] = [];

  function processPair(
    [name, op]: OpPair,
    displaySection: string,
    requiresNamespace: boolean
  ) {
    return maker.make({
      name,
      displaySection,
      requiresNamespace,
      definitions: [
        makeDefinition([frDist, frNumber], frDist, ([dist, n], context) =>
          unwrapDistResult(
            op(dist, new SymbolicDist.PointMass(n), contextToOpts(context))
          )
        ),
        makeDefinition([frNumber, frDist], frDist, ([n, dist], context) =>
          unwrapDistResult(
            op(new SymbolicDist.PointMass(n), dist, contextToOpts(context))
          )
        ),
        makeDefinition([frDist, frDist], frDist, ([dist1, dist2], context) =>
          unwrapDistResult(op(dist1, dist2, contextToOpts(context)))
        ),
      ],
    });
  }

  for (const pair of [...algebraicOps]) {
    fns.push(processPair(pair, "Algebra (Dist)", false));
  }

  for (const pair of [...pointwiseOps]) {
    fns.push(processPair(pair, "Pointwise Algebra", true));
  }

  return fns;
};

export const library: FRFunction[] = [
  maker.make({
    name: "sparkline",
    displaySection: "Utility",
    description: `
Produce a sparkline of length \`\`n\`\`. For example, \`▁▁▁▁▁▂▄▆▇██▇▆▄▂▁▁▁▁▁\`. These can be useful for testing or quick visualizations that can be copied and pasted into text.`,
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
    name: "sample",
    displaySection: "Basic Functions",
    fn: (d, { rng }) => d.sample(rng),
  }),
  maker.make({
    name: "sampleN",
    displaySection: "Basic Functions",
    definitions: [
      makeDefinition(
        [frDist, frNamed("n", frNumber)],
        frArray(frNumber),
        ([dist, n], { rng }) => {
          return dist.sampleN(n | 0, rng);
        }
      ),
    ],
  }),
  maker.d2d({
    name: "exp",
    displaySection: "Basic Functions",
    fn: (dist, context) => {
      return unwrapDistResult(
        binaryOperations.algebraicPower(
          new SymbolicDist.PointMass(Math.E),
          dist,
          contextToOpts(context)
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
  maker.d2n({
    name: "integralSum",
    displaySection: "Normalization",
    description: `Get the sum of the integral of a distribution. If the distribution is normalized, this will be 1.0. This is useful for understanding unnormalized distributions.`,
    fn: (d) => d.integralSum(),
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
        ([dist, left, right], { environment, rng }) =>
          unwrapDistResult(
            dist.truncate(left, right, { env: environment, rng })
          )
      ),
    ],
  }),
  maker.dn2d({
    name: "truncateLeft",
    displaySection: "Basic Functions",
    fn: (dist, x, context) =>
      unwrapDistResult(
        dist.truncate(x, undefined, {
          env: context.environment,
          rng: context.rng,
        })
      ),
  }),
  maker.dn2d({
    name: "truncateRight",
    displaySection: "Basic Functions",
    fn: (dist, x, context) =>
      unwrapDistResult(
        dist.truncate(undefined, x, {
          env: context.environment,
          rng: context.rng,
        })
      ),
  }),
  ...makeOperationFns(),
  maker.make({
    name: "sum",
    displaySection: "Algebra (List)",
    definitions: [
      makeDefinition([frArray(frDistOrNumber)], frDist, ([dists], context) =>
        unwrapDistResult(
          algebraicSum(
            dists.map(parseDistFromDistOrNumber),
            contextToOpts(context)
          )
        )
      ),
    ],
  }),
  maker.make({
    name: "product",
    displaySection: "Algebra (List)",
    definitions: [
      makeDefinition([frArray(frDistOrNumber)], frDist, ([dists], context) =>
        unwrapDistResult(
          algebraicProduct(
            dists.map(parseDistFromDistOrNumber),
            contextToOpts(context)
          )
        )
      ),
    ],
  }),
  maker.make({
    name: "cumsum",
    displaySection: "Algebra (List)",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frArray(frDist),
        ([dists], context) =>
          unwrapDistResult(
            algebraicCumSum(
              dists.map(parseDistFromDistOrNumber),
              contextToOpts(context)
            )
          )
      ),
    ],
  }),
  maker.make({
    name: "cumprod",
    displaySection: "Algebra (List)",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frArray(frDist),
        ([dists], context) =>
          unwrapDistResult(
            algebraicCumProd(
              dists.map(parseDistFromDistOrNumber),
              contextToOpts(context)
            )
          )
      ),
    ],
  }),

  maker.d2d({
    name: "log",
    displaySection: "Algebra (Dist)",
    fn: (dist, context) =>
      unwrapDistResult(
        binaryOperations.algebraicLogarithm(
          dist,
          new SymbolicDist.PointMass(Math.E),
          contextToOpts(context)
        )
      ),
  }),
  maker.d2d({
    name: "log10",
    displaySection: "Algebra (Dist)",
    fn: (dist, context) =>
      unwrapDistResult(
        binaryOperations.algebraicLogarithm(
          dist,
          new SymbolicDist.PointMass(10),
          contextToOpts(context)
        )
      ),
  }),
  maker.d2d({
    name: "unaryMinus",
    displaySection: "Algebra (Dist)",
    fn: (dist, context) =>
      unwrapDistResult(
        binaryOperations.algebraicMultiply(
          dist,
          new SymbolicDist.PointMass(-1),
          contextToOpts(context)
        )
      ),
  }),
  maker.d2d({
    name: "dotExp",
    fn: (dist, context) =>
      unwrapDistResult(
        binaryOperations.pointwisePower(
          new SymbolicDist.PointMass(Math.E),
          dist,
          contextToOpts(context)
        )
      ),
  }),
  maker.make({
    name: "diff",
    displaySection: "Algebra (List)",
    definitions: [
      makeDefinition(
        [frArray(frDistOrNumber)],
        frArray(frDist),
        ([dists], context) =>
          unwrapDistResult(
            algebraicDiff(
              dists.map(parseDistFromDistOrNumber),
              contextToOpts(context)
            )
          )
      ),
    ],
  }),
];
