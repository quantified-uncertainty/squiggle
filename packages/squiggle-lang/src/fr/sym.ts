import * as BernoulliJs from "../dists/SymbolicDist/Bernoulli.js";
import * as BetaJs from "../dists/SymbolicDist/Beta.js";
import * as CauchyJs from "../dists/SymbolicDist/Cauchy.js";
import * as ExponentialJs from "../dists/SymbolicDist/Exponential.js";
import * as GammaJs from "../dists/SymbolicDist/Gamma.js";
import * as SymbolicDist from "../dists/SymbolicDist/index.js";
import * as LogisticJs from "../dists/SymbolicDist/Logistic.js";
import * as LognormalJs from "../dists/SymbolicDist/Lognormal.js";
import * as PointMassJs from "../dists/SymbolicDist/PointMass.js";
import * as TriangularJs from "../dists/SymbolicDist/Triangular.js";
import * as UniformJs from "../dists/SymbolicDist/Uniform.js";
import { FRFunction, makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frDistSymbolic,
  frNumber,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import * as Result from "../utility/result.js";
import { CI_CONFIG, SymDistResult, unwrapSymDistResult } from "./distUtil.js";

const maker = new FnFactory({
  nameSpace: "Sym",
  requiresNamespace: true,
});

function makeTwoArgsSymDist(fn: (v1: number, v2: number) => SymDistResult) {
  return makeDefinition([frNumber, frNumber], frDistSymbolic, ([v1, v2]) => {
    const result = fn(v1, v2);
    return unwrapSymDistResult(result);
  });
}

function makeOneArgSymDist(fn: (v: number) => SymDistResult) {
  return makeDefinition([frNumber], frDistSymbolic, ([v]) => {
    const result = fn(v);
    return unwrapSymDistResult(result);
  });
}

function makeCISymDist<K1 extends string, K2 extends string>(
  lowKey: K1,
  highKey: K2,
  fn: (low: number, high: number) => SymDistResult
) {
  return makeDefinition(
    [frDict([lowKey, frNumber], [highKey, frNumber])],
    frDistSymbolic,
    ([dict]) => unwrapSymDistResult(fn(dict[lowKey], dict[highKey]))
  );
}

function makeMeanStdevSymDist(
  fn: (
    mean: number,
    stdev: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition(
    [frDict(["mean", frNumber], ["stdev", frNumber])],
    frDistSymbolic,
    ([{ mean, stdev }]) => unwrapSymDistResult(fn(mean, stdev))
  );
}

export const library: FRFunction[] = [
  maker.make({
    name: "normal",
    examples: [
      makeFnExample("Sym.normal(5, 1)"),
      makeFnExample("Sym.normal({ p5: 4, p95: 10 })"),
      makeFnExample("Sym.normal({ p10: 4, p90: 10 })"),
      makeFnExample("Sym.normal({ p25: 4, p75: 10 })"),
      makeFnExample("Sym.normal({ mean: 5, stdev: 2 })"),
    ],
    definitions: [
      makeTwoArgsSymDist((mean, stdev) =>
        SymbolicDist.Normal.make({ mean, stdev })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCISymDist(entry.lowKey, entry.highKey, (low, high) =>
          SymbolicDist.Normal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevSymDist((mean, stdev) =>
        SymbolicDist.Normal.make({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "lognormal",
    examples: [
      makeFnExample("Sym.lognormal(0.5, 0.8)"),
      makeFnExample("Sym.lognormal({ p5: 4, p95: 10 })"),
      makeFnExample("Sym.lognormal({ p10: 4, p90: 10 })"),
      makeFnExample("Sym.lognormal({ p25: 4, p75: 10 })"),
      makeFnExample("Sym.lognormal({ mean: 5, stdev: 2 })"),
    ],
    definitions: [
      makeTwoArgsSymDist((mu, sigma) =>
        LognormalJs.Lognormal.make({ mu, sigma })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCISymDist(entry.lowKey, entry.highKey, (low, high) =>
          LognormalJs.Lognormal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevSymDist((mean, stdev) =>
        LognormalJs.Lognormal.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "uniform",
    examples: [makeFnExample("Sym.uniform(10, 12)")],
    definitions: [
      makeTwoArgsSymDist((low, high) => UniformJs.Uniform.make({ low, high })),
    ],
  }),
  maker.make({
    name: "beta",
    examples: [
      makeFnExample("Sym.beta(20, 25)"),
      makeFnExample("Sym.beta({ mean: 0.39, stdev: 0.1 })"),
    ],
    definitions: [
      makeTwoArgsSymDist((alpha, beta) => BetaJs.Beta.make({ alpha, beta })),
      makeMeanStdevSymDist((mean, stdev) =>
        BetaJs.Beta.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "cauchy",
    examples: [makeFnExample("Sym.cauchy(5, 1)")],
    definitions: [
      makeTwoArgsSymDist((local, scale) =>
        CauchyJs.Cauchy.make({ local, scale })
      ),
    ],
  }),
  maker.make({
    name: "gamma",
    examples: [makeFnExample("Sym.gamma(5, 1)")],
    definitions: [
      makeTwoArgsSymDist((shape, scale) =>
        GammaJs.Gamma.make({ shape, scale })
      ),
    ],
  }),
  maker.make({
    name: "logistic",
    examples: [makeFnExample("Sym.logistic(5, 1)")],
    definitions: [
      makeTwoArgsSymDist((location, scale) =>
        LogisticJs.Logistic.make({ location, scale })
      ),
    ],
  }),
  maker.make({
    name: "exponential",
    examples: [makeFnExample("Sym.exponential(2)")],
    definitions: [
      makeOneArgSymDist((rate) => ExponentialJs.Exponential.make(rate)),
    ],
  }),
  maker.make({
    name: "bernoulli",
    examples: [makeFnExample("Sym.bernoulli(0.5)")],
    definitions: [makeOneArgSymDist((p) => BernoulliJs.Bernoulli.make(p))],
  }),
  maker.make({
    name: "pointMass",
    requiresNamespace: false,
    examples: [makeFnExample("pointMass(0.5)")],
    description:
      "Point mass distributions are already symbolic, so you can use the regular `pointMass` function.",
    definitions: [
      makeDefinition([frNumber], frDistSymbolic, ([v]) => {
        const result = PointMassJs.PointMass.make(v);
        return unwrapSymDistResult(result);
      }),
    ],
  }),
  maker.make({
    name: "triangular",
    examples: [makeFnExample("Sym.triangular(3, 5, 10)")],
    definitions: [
      makeDefinition(
        [frNumber, frNumber, frNumber],
        frDistSymbolic,
        ([low, medium, high]) => {
          const result = TriangularJs.Triangular.make({ low, medium, high });
          return unwrapSymDistResult(result);
        }
      ),
    ],
  }),
];
