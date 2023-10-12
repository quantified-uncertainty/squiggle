import { BaseDist } from "../dist/BaseDist.js";
import { argumentError, otherError } from "../dist/DistError.js";
import * as SampleSetDist from "../dist/SampleSetDist/index.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { REDistributionError, REOther } from "../errors/messages.js";
import { Env } from "../index.js";
import { FRFunction } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDistOrNumber,
  frNumber,
  frDict,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { OtherOperationError } from "../operationError.js";
import * as Result from "../utility/result.js";
import { Value, vDist } from "../value/index.js";
import { distResultToValue } from "./genericDist.js";
import { mixtureDefinitions } from "./mixture.js";

export const CI_CONFIG = [
  { lowKey: "p5", highKey: "p95", probability: 0.9 },
  { lowKey: "p10", highKey: "p90", probability: 0.8 },
  { lowKey: "p25", highKey: "p75", probability: 0.5 },
] as const;

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: false,
});

function makeSampleSet(d: BaseDist, env: Env) {
  const result = SampleSetDist.SampleSetDist.fromDist(d, env);
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}

function twoVarSample(
  v1: BaseDist | number,
  v2: BaseDist | number,
  env: Env,
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
): Value {
  const sampleFn = (a: number, b: number) =>
    Result.fmap2(
      fn(a, b),
      (d) => d.sample(),
      (e) => new OtherOperationError(e)
    );

  if (v1 instanceof BaseDist && v2 instanceof BaseDist) {
    const s1 = makeSampleSet(v1, env);
    const s2 = makeSampleSet(v2, env);
    return distResultToValue(
      SampleSetDist.map2({
        fn: sampleFn,
        t1: s1,
        t2: s2,
      })
    );
  } else if (v1 instanceof BaseDist && typeof v2 === "number") {
    const s1 = makeSampleSet(v1, env);
    return distResultToValue(s1.samplesMap((a) => sampleFn(a, v2)));
  } else if (typeof v1 === "number" && v2 instanceof BaseDist) {
    const s2 = makeSampleSet(v2, env);
    return distResultToValue(s2.samplesMap((a) => sampleFn(v1, a)));
  } else if (typeof v1 === "number" && typeof v2 === "number") {
    const result = fn(v1, v2);
    if (!result.ok) {
      throw new REOther(result.value);
    }
    return vDist(makeSampleSet(result.value, env));
  }
  throw new REOther("Impossible branch");
}

function makeTwoArgsDist(
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition(
    [frDistOrNumber, frDistOrNumber],
    ([v1, v2], { environment }) => twoVarSample(v1, v2, environment, fn)
  );
}

function makeCIDist<K1 extends string, K2 extends string>(
  lowKey: K1,
  highKey: K2,
  fn: (
    low: number,
    high: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition(
    [frDict([lowKey, frNumber], [highKey, frNumber])],
    ([dict], { environment }) =>
      twoVarSample(dict[lowKey], dict[highKey], environment, fn)
  );
}

function makeMeanStdevDist(
  fn: (
    mean: number,
    stdev: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition(
    [frDict(["mean", frNumber], ["stdev", frNumber])],
    ([{ mean, stdev }], { environment }) =>
      twoVarSample(mean, stdev, environment, fn)
  );
}

function makeOneArgDist(
  fn: (v: number) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition([frDistOrNumber], ([v], { environment }) => {
    const sampleFn = (a: number) =>
      Result.fmap2(
        fn(a),
        (d) => d.sample(),
        (e) => new OtherOperationError(e)
      );

    if (v instanceof BaseDist) {
      const s = makeSampleSet(v, environment);
      return distResultToValue(s.samplesMap(sampleFn));
    } else if (typeof v === "number") {
      const result = fn(v);
      if (!result.ok) {
        throw new REOther(result.value);
      }
      return vDist(makeSampleSet(result.value, environment));
    }
    throw new REOther("Impossible branch");
  });
}

export const library: FRFunction[] = [
  maker.make({
    name: "mx",
    examples: ["mx(1,normal(5,2))"],
    definitions: mixtureDefinitions,
  }),
  maker.make({
    name: "mixture",
    examples: ["mixture(1,normal(5,2))"],
    definitions: mixtureDefinitions,
  }),
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
      makeTwoArgsDist((mean, stdev) =>
        SymbolicDist.Normal.make({ mean, stdev })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCIDist(entry.lowKey, entry.highKey, (low, high) =>
          SymbolicDist.Normal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevDist((mean, stdev) =>
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
      makeTwoArgsDist((mu, sigma) =>
        SymbolicDist.Lognormal.make({ mu, sigma })
      ),
      ...CI_CONFIG.map((entry) =>
        makeCIDist(entry.lowKey, entry.highKey, (low, high) =>
          SymbolicDist.Lognormal.fromCredibleInterval({
            low,
            high,
            probability: entry.probability,
          })
        )
      ),
      makeMeanStdevDist((mean, stdev) =>
        SymbolicDist.Lognormal.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "uniform",
    examples: ["uniform(10, 12)"],
    definitions: [
      makeTwoArgsDist((low, high) => SymbolicDist.Uniform.make({ low, high })),
    ],
  }),
  maker.make({
    name: "beta",
    examples: ["beta(20, 25)", "beta({mean: 0.39, stdev: 0.1})"],
    definitions: [
      makeTwoArgsDist((alpha, beta) => SymbolicDist.Beta.make({ alpha, beta })),
      makeMeanStdevDist((mean, stdev) =>
        SymbolicDist.Beta.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "cauchy",
    examples: ["cauchy(5, 1)"],
    definitions: [
      makeTwoArgsDist((local, scale) =>
        SymbolicDist.Cauchy.make({ local, scale })
      ),
    ],
  }),
  maker.make({
    name: "gamma",
    examples: ["gamma(5, 1)"],
    definitions: [
      makeTwoArgsDist((shape, scale) =>
        SymbolicDist.Gamma.make({ shape, scale })
      ),
    ],
  }),
  maker.make({
    name: "logistic",
    examples: ["logistic(5, 1)"],
    definitions: [
      makeTwoArgsDist((location, scale) =>
        SymbolicDist.Logistic.make({ location, scale })
      ),
    ],
  }),
  maker.make({
    name: "to",
    examples: ["5 to 10", "to(5,10)"],
    definitions: [
      makeTwoArgsDist((low, high) => {
        if (low >= high) {
          throw new REDistributionError(
            argumentError("Low value must be less than high value")
          );
        } else if (low <= 0 || high <= 0) {
          throw new REDistributionError(
            argumentError(
              `The "to" function only accepts paramaters above 0. It's a shorthand for lognormal({p5:min, p95:max}), which is only valid with positive entries for then minimum and maximum. If you would like to use a normal distribution, which accepts values under 0, you can use it like this: normal({p5:${low}, p95:${high}}).`
            )
          );
        }
        return SymbolicDist.Lognormal.fromCredibleInterval({
          low,
          high,
          probability: 0.9,
        });
      }),
    ],
  }),
  maker.make({
    name: "exponential",
    examples: ["exponential(2)"],
    definitions: [
      makeOneArgDist((rate) => SymbolicDist.Exponential.make(rate)),
    ],
  }),
  maker.make({
    name: "bernoulli",
    examples: ["bernoulli(0.5)"],
    definitions: [makeOneArgDist((p) => SymbolicDist.Bernoulli.make(p))],
  }),
  maker.make({
    name: "triangular",
    examples: ["triangular(3, 5, 10)"],
    definitions: [
      makeDefinition(
        [frNumber, frNumber, frNumber],
        ([low, medium, high], { environment }) => {
          const result = SymbolicDist.Triangular.make({ low, medium, high });
          if (!result.ok) {
            throw new REDistributionError(otherError(result.value));
          }
          return vDist(makeSampleSet(result.value, environment));
        }
      ),
    ],
  }),
];
