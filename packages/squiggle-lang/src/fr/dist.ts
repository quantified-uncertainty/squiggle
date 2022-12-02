import { BaseDist } from "../dist/BaseDist";
import { DistError } from "../dist/DistError";
import { toSampleSetDist } from "../dist/DistOperations";
import * as SampleSetDist from "../dist/SampleSetDist/SampleSetDist";
import * as SymbolicDist from "../dist/SymbolicDist";
import { Env } from "..";
import { FRFunction } from "../library/registry/core";
import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frDistOrNumber,
  frNumber,
  frRecord,
} from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { OtherOperationError } from "../operationError";
import * as Result from "../utility/result";
import { Value, vDist } from "../value";
import {
  ErrorMessage,
  REDistributionError,
  REOther,
} from "../reducer/ErrorMessage";

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

const makeP5P95Dist = (
  name: string,
  fn: (
    p5: number,
    p95: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) => {
  return makeDefinition(
    name,
    [frRecord(["p5", frNumber], ["p95", frNumber])],
    ([{ p5, p95 }], { environment }) => twoVarSample(p5, p95, environment, fn)
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
      "normal({mean: 5, stdev: 2})",
    ],
    definitions: [
      makeTwoArgsDist("normal", (mean, stdev) =>
        SymbolicDist.Normal.make({ mean, stdev })
      ),
      makeP5P95Dist("normal", (p5, p95) =>
        SymbolicDist.Normal.from90PercentCI(p5, p95)
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
      "lognormal({mean: 5, stdev: 2})",
    ],
    definitions: [
      makeTwoArgsDist("lognormal", (mu, sigma) =>
        SymbolicDist.Lognormal.make({ mu, sigma })
      ),
      makeP5P95Dist("lognormal", (p5, p95) =>
        SymbolicDist.Lognormal.from90PercentCI(p5, p95)
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
    examples: [`5 to 10`, `to(5,10)`, `-5 to 5`],
    definitions: [
      makeTwoArgsDist("to", (low, high) =>
        SymbolicDist.From90thPercentile.make(low, high)
      ),
      makeTwoArgsDist("credibleIntervalToDistribution", (low, high) =>
        SymbolicDist.From90thPercentile.make(low, high)
      ),
    ],
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
      makeOneArgDist("pointMass", (f) => SymbolicDist.Float.make(f)),
    ],
  }),
];
