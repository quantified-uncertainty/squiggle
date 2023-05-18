import { BaseDist } from "../dist/BaseDist.js";
import { DistError, otherError } from "../dist/DistError.js";
import {
  BinaryOperation,
  binaryOperations,
} from "../dist/distOperations/index.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { FRFunction } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDist, frNumber } from "../library/registry/frTypes.js";
import { FnFactory, unpackDistResult } from "../library/registry/helpers.js";
import * as magicNumbers from "../magicNumbers.js";
import { ErrorMessage, REDistributionError } from "../reducer/ErrorMessage.js";
import * as Result from "../utility/result.js";
import { Ok } from "../utility/result.js";
import { Value, vArray, vDist, vNumber } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "",
  requiresNamespace: false,
});

export const toValueResult = (
  result: Result.result<BaseDist, DistError>
): Result.result<Value, ErrorMessage> => {
  return Result.fmap2(result, vDist, (e) => REDistributionError(e));
};

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
  const twoArgTypes = [
    // can't use DistOrNumber+DistOrNumber, since number+number should be delegated to builtin arithmetics
    [frDist, frNumber],
    [frNumber, frDist],
    [frDist, frDist],
  ];

  const fns: FRFunction[] = [];

  for (const [name, op] of [...algebraicOps, ...pointwiseOps]) {
    fns.push(
      maker.fromDefinition(
        makeDefinition(name, [frDist, frNumber], ([dist, n], { environment }) =>
          toValueResult(
            op(dist, new SymbolicDist.PointMass(n), { env: environment })
          )
        )
      )
    );
    fns.push(
      maker.fromDefinition(
        makeDefinition(name, [frNumber, frDist], ([n, dist], { environment }) =>
          toValueResult(
            op(new SymbolicDist.PointMass(n), dist, { env: environment })
          )
        )
      )
    );
    fns.push(
      maker.fromDefinition(
        makeDefinition(
          name,
          [frDist, frDist],
          ([dist1, dist2], { environment }) =>
            toValueResult(op(dist1, dist2, { env: environment }))
        )
      )
    );
  }

  return fns;
};

export const library: FRFunction[] = [
  maker.d2s({
    name: "sparkline",
    fn: (d, env) =>
      unpackDistResult(
        d.toSparkline(magicNumbers.Environment.sparklineLength, env)
      ),
  }),
  maker.dn2s({
    name: "sparkline",
    fn: (d, n, env) => unpackDistResult(d.toSparkline(n | 0, env)),
  }),
  maker.d2s({ name: "toString", fn: (d) => d.toString() }),
  maker.d2n({
    name: "mean",
    fn: (d) => d.mean(),
  }),
  maker.d2n({ name: "stdev", fn: (d) => unpackDistResult(d.stdev()) }),
  maker.d2n({ name: "variance", fn: (d) => unpackDistResult(d.variance()) }),
  maker.d2n({ name: "min", fn: (d) => d.min() }),
  maker.d2n({ name: "max", fn: (d) => d.max() }),
  maker.d2n({ name: "mode", fn: (d) => unpackDistResult(d.mode()) }),
  maker.d2n({ name: "sample", fn: (d) => d.sample() }),
  maker.d2n({ name: "integralSum", fn: (d) => d.integralSum() }),
  maker.fromDefinition(
    makeDefinition(
      "triangular",
      [frNumber, frNumber, frNumber],
      ([low, medium, high]) =>
        Result.fmap2(
          SymbolicDist.Triangular.make({ low, medium, high }),
          vDist,
          (e) => REDistributionError(otherError(e))
        )
    )
  ),
  maker.fromDefinition(
    makeDefinition("sampleN", [frDist, frNumber], ([dist, n]) => {
      return Ok(vArray(dist.sampleN(n | 0).map(vNumber)));
    })
  ),
  maker.d2d({
    name: "exp",
    fn: (dist, env) => {
      return unpackDistResult(
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
    fn: (d, env) => unpackDistResult(d.toPointSetDist(env)),
  }),
  maker.dn2n({
    name: "cdf",
    fn: (d, x) => d.cdf(x),
  }),
  maker.dn2n({
    name: "pdf",
    fn: (d, x, env) => unpackDistResult(d.pdf(x, { env })),
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
      unpackDistResult(dist.truncate(x, undefined, { env })),
  }),
  maker.dn2d({
    name: "truncateRight",
    fn: (dist, x, env) =>
      unpackDistResult(dist.truncate(undefined, x, { env })),
  }),
  maker.fromDefinition(
    makeDefinition(
      "truncate",
      [frDist, frNumber, frNumber],
      ([dist, left, right], { environment }) =>
        toValueResult(dist.truncate(left, right, { env: environment }))
    )
  ),
  maker.d2d({
    name: "log",
    fn: (dist, env) =>
      unpackDistResult(
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
      unpackDistResult(
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
      unpackDistResult(
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
      unpackDistResult(
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
