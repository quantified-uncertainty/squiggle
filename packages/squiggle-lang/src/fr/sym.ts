import * as SymbolicDist from "../dist/SymbolicDist.js";
import { FRFunction } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDict, frNumber } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import * as Result from "../utility/result.js";
import { CI_CONFIG, SymDistResult, symDistResultToValue } from "./distUtil.js";

const maker = new FnFactory({
  nameSpace: "Sym",
  requiresNamespace: true,
});

function makeTwoArgsSymDist(fn: (v1: number, v2: number) => SymDistResult) {
  return makeDefinition([frNumber, frNumber], ([v1, v2]) => {
    const result = fn(v1, v2);
    return symDistResultToValue(result);
  });
}

function makeOneArgSymDist(fn: (v: number) => SymDistResult) {
  return makeDefinition([frNumber], ([v]) => {
    const result = fn(v);
    return symDistResultToValue(result);
  });
}

function makeCISymDist<K1 extends string, K2 extends string>(
  lowKey: K1,
  highKey: K2,
  fn: (low: number, high: number) => SymDistResult
) {
  return makeDefinition(
    [frDict([lowKey, frNumber], [highKey, frNumber])],
    ([dict]) => symDistResultToValue(fn(dict[lowKey], dict[highKey]))
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
    ([{ mean, stdev }]) => symDistResultToValue(fn(mean, stdev))
  );
}

export const library: FRFunction[] = [
  maker.make({
    name: "normal",
    examples: [
      "Sym.normal(5, 1)",
      "Sym.normal({ p5: 4, p95: 10 })",
      "Sym.normal({ p10: 4, p90: 10 })",
      "Sym.normal({ p25: 4, p75: 10 })",
      "Sym.normal({ mean: 5, stdev: 2 })",
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
      "Sym.lognormal(0.5, 0.8)",
      "Sym.lognormal({ p5: 4, p95: 10 })",
      "Sym.lognormal({ p10: 4, p90: 10 })",
      "Sym.lognormal({ p25: 4, p75: 10 })",
      "Sym.lognormal({ mean: 5, stdev: 2 })",
    ],
    definitions: [
      makeTwoArgsSymDist((mu, sigma) =>
        SymbolicDist.Lognormal.make({ mu, sigma })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCISymDist(entry.lowKey, entry.highKey, (low, high) =>
          SymbolicDist.Lognormal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevSymDist((mean, stdev) =>
        SymbolicDist.Lognormal.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "uniform",
    examples: ["Sym.uniform(10, 12)"],
    definitions: [
      makeTwoArgsSymDist((low, high) =>
        SymbolicDist.Uniform.make({ low, high })
      ),
    ],
  }),
  maker.make({
    name: "beta",
    examples: ["Sym.beta(20, 25)", "Sym.beta({ mean: 0.39, stdev: 0.1 })"],
    definitions: [
      makeTwoArgsSymDist((alpha, beta) =>
        SymbolicDist.Beta.make({ alpha, beta })
      ),
      makeMeanStdevSymDist((mean, stdev) =>
        SymbolicDist.Beta.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "cauchy",
    examples: ["Sym.cauchy(5, 1)"],
    definitions: [
      makeTwoArgsSymDist((local, scale) =>
        SymbolicDist.Cauchy.make({ local, scale })
      ),
    ],
  }),
  maker.make({
    name: "gamma",
    examples: ["Sym.gamma(5, 1)"],
    definitions: [
      makeTwoArgsSymDist((shape, scale) =>
        SymbolicDist.Gamma.make({ shape, scale })
      ),
    ],
  }),
  maker.make({
    name: "logistic",
    examples: ["Sym.logistic(5, 1)"],
    definitions: [
      makeTwoArgsSymDist((location, scale) =>
        SymbolicDist.Logistic.make({ location, scale })
      ),
    ],
  }),
  maker.make({
    name: "exponential",
    examples: ["Sym.exponential(2)"],
    definitions: [
      makeOneArgSymDist((rate) => SymbolicDist.Exponential.make(rate)),
    ],
  }),
  maker.make({
    name: "bernoulli",
    examples: ["Sym.bernoulli(0.5)"],
    definitions: [makeOneArgSymDist((p) => SymbolicDist.Bernoulli.make(p))],
  }),
  maker.make({
    name: "pointMass",
    requiresNamespace: false,
    examples: ["pointMass(0.5)"],
    definitions: [
      makeDefinition([frNumber], ([v]) => {
        const result = SymbolicDist.PointMass.make(v);
        return symDistResultToValue(result);
      }),
    ],
  }),
  maker.make({
    name: "triangular",
    examples: ["Sym.triangular(3, 5, 10)"],
    definitions: [
      makeDefinition([frNumber, frNumber, frNumber], ([low, medium, high]) => {
        const result = SymbolicDist.Triangular.make({ low, medium, high });
        return symDistResultToValue(result);
      }),
    ],
  }),
];
