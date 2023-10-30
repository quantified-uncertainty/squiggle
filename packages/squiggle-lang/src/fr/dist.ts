import { argumentError, otherError } from "../dist/DistError.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { REDistributionError } from "../errors/messages.js";
import { FRFunction } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDist, frNumber, frDict } from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeOneArgDist,
  makeSampleSet,
  makeTwoArgsDist,
  twoVarSample,
} from "../library/registry/helpers.js";
import * as Result from "../utility/result.js";
import { vDist } from "../value/index.js";
import { CI_CONFIG, symDistResultToValue } from "./distUtil.js";
import { mixtureDefinitions } from "./mixture.js";

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: false,
});

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

export const library: FRFunction[] = [
  //We might want to later add all of the options to make() tht SampleSet has. For example, function() and list().
  maker.make({
    name: "make",
    requiresNamespace: true,
    examples: ["Dist.make(5)", "Dist.make(normal({p5: 4, p95: 10}))"],
    definitions: [
      makeDefinition([frDist], ([dist]) => vDist(dist)),
      makeDefinition([frNumber], ([v]) =>
        symDistResultToValue(SymbolicDist.PointMass.make(v))
      ),
    ],
  }),
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
