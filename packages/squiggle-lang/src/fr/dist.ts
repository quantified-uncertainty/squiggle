import { argumentError, otherError } from "../dist/DistError.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import { REDistributionError } from "../errors/messages.js";
import { FRFunction, makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frDist,
  frDistSymbolic,
  frNamed,
  frNumber,
  frSampleSetDist,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeOneArgSamplesetDist,
  makeSampleSet,
  makeTwoArgsSamplesetDist,
  twoVarSample,
} from "../library/registry/helpers.js";
import * as Result from "../utility/result.js";
import { CI_CONFIG, unwrapSymDistResult } from "./distUtil.js";
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
    frSampleSetDist,
    ([dict], reducer) => twoVarSample(dict[lowKey], dict[highKey], reducer, fn)
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
    frSampleSetDist,
    ([{ mean, stdev }], reducer) => twoVarSample(mean, stdev, reducer, fn)
  );
}

export const library: FRFunction[] = [
  //We might want to later add all of the options to make() tht SampleSet has. For example, function() and list().
  maker.make({
    name: "make",
    requiresNamespace: true,
    displaySection: "Distributions",
    examples: [
      makeFnExample("Dist.make(5)"),
      makeFnExample("Dist.make(normal({p5: 4, p95: 10}))"),
    ],
    definitions: [
      makeDefinition([frDist], frDist, ([dist]) => dist),
      makeDefinition([frNumber], frDistSymbolic, ([v]) =>
        unwrapSymDistResult(SymbolicDist.PointMass.make(v))
      ),
    ],
  }),
  maker.make({
    name: "mixture",
    displaySection: "Distributions",
    examples: [
      makeFnExample("mixture(1,normal(5,2))"),
      makeFnExample(
        "mixture(normal(5,2), normal(10,2), normal(15,2), [0.3, 0.5, 0.2])"
      ),
      makeFnExample(
        "mixture([normal(5,2), normal(10,2), normal(15,2), normal(20,1)], [0.3, 0.5, 0.1, 0.1])"
      ),
    ],
    description: `The \`\`mixture\`\` function takes a list of distributions and a list of weights, and returns a new distribution that is a mixture of the distributions in the list. The weights should be positive numbers that sum to 1. If no weights are provided, the function will assume that all distributions have equal weight.
    
Note: If you want to pass in over 5 distributions, you must use the list syntax.`,
    definitions: mixtureDefinitions,
  }),
  maker.make({
    name: "mx",
    displaySection: "Distributions",
    examples: [makeFnExample("mx(1,normal(5,2))")],
    description: "Alias for mixture()",
    definitions: mixtureDefinitions,
  }),
  maker.make({
    name: "normal",
    displaySection: "Distributions",
    examples: [
      makeFnExample("normal(5,1)"),
      makeFnExample("normal({p5: 4, p95: 10})"),
      makeFnExample("normal({p10: 4, p90: 10})"),
      makeFnExample("normal({p25: 4, p75: 10})"),
      makeFnExample("normal({mean: 5, stdev: 2})"),
    ],
    definitions: [
      makeTwoArgsSamplesetDist(
        (mean, stdev) => SymbolicDist.Normal.make({ mean, stdev }),
        "mean",
        "stdev"
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
      makeFnExample("lognormal(0.5, 0.8)"),
      makeFnExample("lognormal({p5: 4, p95: 10})"),
      makeFnExample("lognormal({p10: 4, p90: 10})"),
      makeFnExample("lognormal({p25: 4, p75: 10})"),
      makeFnExample("lognormal({mean: 5, stdev: 2})"),
    ],
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (mu, sigma) => SymbolicDist.Lognormal.make({ mu, sigma }),
        "mu",
        "sigma"
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
    examples: [makeFnExample("uniform(10, 12)")],
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (low, high) => SymbolicDist.Uniform.make({ low, high }),
        "low",
        "high"
      ),
    ],
  }),
  maker.make({
    name: "beta",
    examples: [
      makeFnExample("beta(20, 25)"),
      makeFnExample("beta({mean: 0.39, stdev: 0.1})"),
    ],
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (alpha, beta) => SymbolicDist.Beta.make({ alpha, beta }),
        "alpha",
        "beta"
      ),
      makeMeanStdevDist((mean, stdev) =>
        SymbolicDist.Beta.fromMeanAndStdev({ mean, stdev })
      ),
    ],
  }),
  maker.make({
    name: "cauchy",
    examples: [makeFnExample("cauchy(5, 1)")],
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (local, scale) => SymbolicDist.Cauchy.make({ local, scale }),
        "location",
        "scale"
      ),
    ],
  }),
  maker.make({
    name: "gamma",
    examples: [makeFnExample("gamma(5, 1)")],
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (shape, scale) => SymbolicDist.Gamma.make({ shape, scale }),
        "shape",
        "scale"
      ),
    ],
  }),
  maker.make({
    name: "logistic",
    examples: [makeFnExample("logistic(5, 1)")],
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (location, scale) => SymbolicDist.Logistic.make({ location, scale }),
        "location",
        "scale"
      ),
    ],
  }),
  maker.make({
    name: "to",
    examples: [makeFnExample("5 to 10"), makeFnExample("to(5,10)")],
    description: `The "to" function is a shorthand for lognormal({p5:min, p95:max}). It does not accept values of 0 or less, as those are not valid for lognormal distributions.`,
    displaySection: "Distributions",
    definitions: [
      makeTwoArgsSamplesetDist(
        (low, high) => {
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
        },
        "p5",
        "p95"
      ),
    ],
  }),
  maker.make({
    name: "exponential",
    examples: [makeFnExample("exponential(2)")],
    displaySection: "Distributions",
    definitions: [
      makeOneArgSamplesetDist(
        (rate) => SymbolicDist.Exponential.make(rate),
        "rate"
      ),
    ],
  }),
  maker.make({
    name: "bernoulli",
    examples: [makeFnExample("bernoulli(0.5)")],
    displaySection: "Distributions",
    definitions: [
      makeOneArgSamplesetDist((p) => SymbolicDist.Bernoulli.make(p), "p"),
    ],
  }),
  maker.make({
    name: "triangular",
    examples: [makeFnExample("triangular(3, 5, 10)")],
    displaySection: "Distributions",
    definitions: [
      makeDefinition(
        [
          frNamed("min", frNumber),
          frNamed("mode", frNumber),
          frNamed("max", frNumber),
        ],
        frSampleSetDist,
        ([low, medium, high], reducer) => {
          const result = SymbolicDist.Triangular.make({ low, medium, high });
          if (!result.ok) {
            throw new REDistributionError(otherError(result.value));
          }
          return makeSampleSet(result.value, reducer);
        }
      ),
    ],
  }),
];
