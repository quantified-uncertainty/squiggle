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
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  parseDistFromDistOrNumber,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import * as magicNumbers from "../magicNumbers.js";

const maker = new FnFactory({
  nameSpace: "",
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

  for (const [name, op] of [...algebraicOps, ...pointwiseOps]) {
    fns.push(
      maker.make({
        name,
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
      })
    );
  }

  return fns;
};

export const library: FRFunction[] = [
  maker.d2s({
    name: "sparkline",
    fn: (d, env) =>
      unwrapDistResult(
        d.toSparkline(magicNumbers.Environment.sparklineLength, env)
      ),
  }),
  maker.dn2s({
    name: "sparkline",
    fn: (d, n, env) => unwrapDistResult(d.toSparkline(n | 0, env)),
  }),
  maker.d2n({
    name: "mean",
    fn: (d) => d.mean(),
  }),
  maker.d2n({
    name: "median",
    fn: (d) => d.inv(0.5),
  }),
  maker.d2n({ name: "stdev", fn: (d) => unwrapDistResult(d.stdev()) }),
  maker.d2n({ name: "variance", fn: (d) => unwrapDistResult(d.variance()) }),
  maker.d2n({ name: "min", fn: (d) => d.min() }),
  maker.d2n({ name: "max", fn: (d) => d.max() }),
  maker.d2n({ name: "mode", fn: (d) => unwrapDistResult(d.mode()) }),
  maker.d2n({ name: "sample", fn: (d) => d.sample() }),
  maker.d2n({ name: "integralSum", fn: (d) => d.integralSum() }),
  maker.fromDefinition(
    "sampleN",
    makeDefinition(
      [frDist, frNamed("n", frNumber)],
      frArray(frNumber),
      ([dist, n]) => {
        return dist.sampleN(n | 0);
      }
    )
  ),
  maker.d2d({
    name: "exp",
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
    fn: (d) => d.normalize(),
  }),
  maker.d2b({
    name: "isNormalized",
    fn: (d) => d.isNormalized(),
  }),
  maker.d2d({
    name: "toPointSet",
    fn: (d, env) => unwrapDistResult(d.toPointSetDist(env)),
  }),
  maker.dn2n({
    name: "cdf",
    fn: (d, x) => d.cdf(x),
  }),
  maker.dn2n({
    name: "pdf",
    fn: (d, x, env) => unwrapDistResult(d.pdf(x, { env })),
  }),
  maker.dn2n({
    name: "inv",
    fn: (d, x) => d.inv(x),
  }),
  maker.dn2n({
    name: "quantile",
    fn: (d, x) => d.inv(x),
  }),
  maker.dn2d({
    name: "truncateLeft",
    fn: (dist, x, env) =>
      unwrapDistResult(dist.truncate(x, undefined, { env })),
  }),
  maker.dn2d({
    name: "truncateRight",
    fn: (dist, x, env) =>
      unwrapDistResult(dist.truncate(undefined, x, { env })),
  }),
  maker.fromDefinition(
    "truncate",
    makeDefinition(
      [frDist, frNamed("left", frNumber), frNamed("right", frNumber)],
      frDist,
      ([dist, left, right], { environment }) =>
        unwrapDistResult(dist.truncate(left, right, { env: environment }))
    )
  ),
  maker.make({
    name: "sum",
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
