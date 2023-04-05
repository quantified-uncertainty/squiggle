import { BaseDist } from "../dist/BaseDist.js";
import { DistError } from "../dist/DistError.js";
import { toSampleSetDist } from "../dist/DistOperations/index.js";
import * as SampleSetDist from "../dist/SampleSetDist/SampleSetDist.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { Env } from "../index.js";
import { FRFunction } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDistOrNumber,
  frNumber,
  frRecord,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { OtherOperationError } from "../operationError.js";
import * as Result from "../utility/result.js";
import { Value, vDist } from "../value/index.js";
import {
  ErrorMessage,
  REDistributionError,
  REOther,
} from "../reducer/ErrorMessage.js";

const CI_CONFIG = [
  { lowKey: "p5", highKey: "p95", probability: 0.9 },
  { lowKey: "p10", highKey: "p90", probability: 0.8 },
  { lowKey: "p25", highKey: "p75", probability: 0.5 },
] as const;

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: false,
});

const makeSampleSet = (d: BaseDist, env: Env) => {
  const result = toSampleSetDist(d, env);
  if (!result.ok) {
    return ErrorMessage.throw(REDistributionError(result.value));
  }
  return result.value;
};

const twoVarSample = (
  v1: BaseDist | number,
  v2: BaseDist | number,
  env: Env,
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
): Result.result<Value, ErrorMessage> => {
  const repack = (r: Result.result<SampleSetDist.SampleSetDist, DistError>) =>
    Result.fmap(Result.errMap(r, REDistributionError), vDist);

  const sampleFn = (a: number, b: number) =>
    Result.fmap2(
      fn(a, b),
      (d) => d.sample(),
      (e) => new OtherOperationError(e)
    );

  if (v1 instanceof BaseDist && v2 instanceof BaseDist) {
    const s1 = makeSampleSet(v1, env);
    const s2 = makeSampleSet(v2, env);
    return repack(
      SampleSetDist.map2({
        fn: sampleFn,
        t1: s1,
        t2: s2,
      })
    );
  } else if (v1 instanceof BaseDist && typeof v2 === "number") {
    const s1 = makeSampleSet(v1, env);
    return repack(s1.samplesMap((a) => sampleFn(a, v2)));
  } else if (typeof v1 === "number" && v2 instanceof BaseDist) {
    const s2 = makeSampleSet(v2, env);
    return repack(s2.samplesMap((a) => sampleFn(v1, a)));
  } else if (typeof v1 === "number" && typeof v2 === "number") {
    return Result.fmap2(fn(v1, v2), vDist, REOther);
  }
  return ErrorMessage.throw(REOther("Impossible branch"));
};

const makeTwoArgsDist = (
  name: string,
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) => {
  return makeDefinition(
    name,
    [frDistOrNumber, frDistOrNumber],
    ([v1, v2], { environment }) => twoVarSample(v1, v2, environment, fn)
  );
};

const makeCIDist = <K1 extends string, K2 extends string>(
  name: string,
  lowKey: K1,
  highKey: K2,
  fn: (
    low: number,
    high: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) => {
  return makeDefinition(
    name,
    [frRecord([lowKey, frNumber], [highKey, frNumber])],
    ([record], { environment }) =>
      twoVarSample(record[lowKey], record[highKey], environment, fn)
  );
};

const makeMeanStdevDist = (
  name: string,
  fn: (
    mean: number,
    stdev: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) => {
  return makeDefinition(
    name,
    [frRecord(["mean", frNumber], ["stdev", frNumber])],
    ([{ mean, stdev }], { environment }) =>
      twoVarSample(mean, stdev, environment, fn)
  );
};

const makeOneArgDist = (
  name: string,
  fn: (v: number) => Result.result<SymbolicDist.SymbolicDist, string>
) => {
  return makeDefinition(name, [frDistOrNumber], ([v], { environment }) => {
    const repack = (r: Result.result<SampleSetDist.SampleSetDist, DistError>) =>
      Result.fmap(Result.errMap(r, REDistributionError), vDist);

    const sampleFn = (a: number) =>
      Result.fmap2(
        fn(a),
        (d) => d.sample(),
        (e) => new OtherOperationError(e)
      );

    if (v instanceof BaseDist) {
      const s = makeSampleSet(v, environment);
      return repack(s.samplesMap(sampleFn));
    } else if (typeof v === "number") {
      return Result.fmap2(fn(v), vDist, REOther);
    }
    return ErrorMessage.throw(REOther("Impossible branch"));
  });
};

export const library: FRFunction[] = [
  maker.make({
    name: "normal",
    examples: [
      "normal(5,1)",
      "normal({p5: 4, p95: 10})",
      "normal({p10: 4, p90: 10})",
      "normal({p25: 4, p75: 10})",
      "normal({mean: 5, stdev: 2})",
    ],
    definitions: [
      makeTwoArgsDist("normal", (mean, stdev) =>
        SymbolicDist.Normal.make({ mean, stdev })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCIDist("normal", entry.lowKey, entry.highKey, (low, high) =>
          SymbolicDist.Normal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevDist("normal", (mean, stdev) =>
        SymbolicDist.Normal.make({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "lognormal",
    examples: [
      "lognormal(0.5, 0.8)",
      "lognormal({p5: 4, p95: 10})",
      "lognormal({p10: 4, p90: 10})",
      "lognormal({p25: 4, p75: 10})",
      "lognormal({mean: 5, stdev: 2})",
    ],
    definitions: [
      makeTwoArgsDist("lognormal", (mu, sigma) =>
        SymbolicDist.Lognormal.make({ mu, sigma })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCIDist("lognormal", entry.lowKey, entry.highKey, (low, high) =>
          SymbolicDist.Lognormal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevDist("lognormal", (mean, stdev) =>
        SymbolicDist.Lognormal.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "uniform",
    examples: [`uniform(10, 12)`],
    definitions: [
      makeTwoArgsDist("uniform", (low, high) =>
        SymbolicDist.Uniform.make({ low, high })
      ),
    ],
  }),
  maker.make({
    name: "beta",
    examples: [`beta(20, 25)`, `beta({mean: 0.39, stdev: 0.1})`],
    definitions: [
      makeTwoArgsDist("beta", (alpha, beta) =>
        SymbolicDist.Beta.make({ alpha, beta })
      ),
      makeMeanStdevDist("beta", (mean, stdev) =>
        SymbolicDist.Beta.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "cauchy",
    examples: [`cauchy(5, 1)`],
    definitions: [
      makeTwoArgsDist("cauchy", (local, scale) =>
        SymbolicDist.Cauchy.make({ local, scale })
      ),
    ],
  }),
  maker.make({
    name: "gamma",
    examples: [`gamma(5, 1)`],
    definitions: [
      makeTwoArgsDist("gamma", (shape, scale) =>
        SymbolicDist.Gamma.make({ shape, scale })
      ),
    ],
  }),
  maker.make({
    name: "logistic",
    examples: [`logistic(5, 1)`],
    definitions: [
      makeTwoArgsDist("logistic", (location, scale) =>
        SymbolicDist.Logistic.make({ location, scale })
      ),
    ],
  }),
  maker.make({
    name: "to (distribution)",
    examples: ["5 to 10", "to(5,10)", "-5 to 5"],
    definitions: ["to", "credibleIntervalToDistribution"].map((functionName) =>
      makeTwoArgsDist(functionName, (low, high) =>
        SymbolicDist.makeFromCredibleInterval({ low, high, probability: 0.9 })
      )
    ),
  }),
  maker.make({
    name: "exponential",
    examples: [`exponential(2)`],
    definitions: [
      makeOneArgDist("exponential", (rate) =>
        SymbolicDist.Exponential.make(rate)
      ),
    ],
  }),
  maker.make({
    name: "bernoulli",
    examples: [`bernoulli(0.5)`],
    definitions: [
      makeOneArgDist("bernoulli", (p) => SymbolicDist.Bernoulli.make(p)),
    ],
  }),
  maker.make({
    name: "pointMass",
    examples: [`pointMass(0.5)`],
    definitions: [
      makeOneArgDist("pointMass", (f) => SymbolicDist.PointMass.make(f)),
    ],
  }),
];
