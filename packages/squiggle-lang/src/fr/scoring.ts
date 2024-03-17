import { BaseDist } from "../dist/BaseDist.js";
import { DistError, operationDistError } from "../dist/DistError.js";
import { Env } from "../dist/env.js";
import { PointSetDist } from "../dist/PointSetDist.js";
import { integralSumDistribution } from "../dist/scoring/DistAnswer.js";
import { logScoreScalarAnswer } from "../dist/scoring/ScalarAnswer.js";
import { REDistributionError } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDict, frDist, frNumber } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { OperationError } from "../operationError.js";
import { MixedShape } from "../PointSet/Mixed.js";
import { ResultC } from "../utility/ResultC.js";

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: true,
});

export function logScoreDistAnswer({
  estimate,
  answer,
  env,
}: {
  estimate: BaseDist;
  answer: BaseDist;
  env: Env;
}): MixedShape {
  const opToDistError = (e: OperationError) =>
    new REDistributionError(operationDistError(e));
  const getPointSetOrError = (dist: BaseDist) =>
    ResultC.fromType(dist.toPointSetDist(env)).getOrThrow(
      (e: DistError) => new REDistributionError(e)
    );

  const _estimate = getPointSetOrError(estimate);
  const _answer = getPointSetOrError(answer);

  return integralSumDistribution({
    estimate: _estimate.pointSet,
    answer: _answer.pointSet,
  }).getOrThrow(opToDistError);
}

export const library = [
  maker.make({
    name: "klDivergence",
    output: "Number",
    examples: [
      makeFnExample("Dist.klDivergence(Sym.normal(5,2), Sym.normal(5,1.5))"),
    ],
    displaySection: "Scoring",
    description: `[Kullback–Leibler divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence) between two distributions.

Note that this can be very brittle. If the second distribution has probability mass at areas where the first doesn't, then the result will be infinite. Due to numeric approximations, some probability mass in point set distributions is rounded to zero, leading to infinite results with klDivergence.`,
    definitions: [
      makeDefinition(
        [frDist, frDist],
        frNumber,
        ([estimate, answer], reducer) =>
          logScoreDistAnswer({
            estimate,
            answer,
            env: reducer.environment,
          }).integralSum()
      ),
    ],
  }),
  maker.make({
    name: "logScoreNumericAnswer",
    output: "Dict",
    displaySection: "Scoring",
    description: `A log loss score. Often that often acts as a [scoring rule](https://en.wikipedia.org/wiki/Scoring_rule). Useful when evaluating the accuracy of a forecast.

    Note that it is fairly slow.`,
    examples: [
      makeFnExample(
        "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1))"
      ),
      makeFnExample(
        "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1)})"
      ),
      makeFnExample("Dist.logScore({estimate: Sym.normal(5,2), answer: 4.5})"),
    ],
    definitions: [
      makeDefinition(
        [frDist, frNumber],
        frDict(["discrete", frNumber], ["continuous", frNumber]),
        ([estimate, answer], reducer) => {
          return logScoreScalarAnswer({
            estimate,
            answer,
            env: reducer.environment,
          })
            .fmap((x) => {
              return {
                discrete: x.discrete,
                continuous: x.continuous,
              };
            })
            .getOrThrow((e) => new REDistributionError(e));
        }
      ),
    ],
  }),
  maker.make({
    name: "logScoreDistAnswer",
    output: "Dict",
    displaySection: "Scoring",
    description: `A log loss score. Often that often acts as a [scoring rule](https://en.wikipedia.org/wiki/Scoring_rule). Useful when evaluating the accuracy of a forecast.

    Note that it is fairly slow.`,
    examples: [
      makeFnExample(
        "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1))"
      ),
      makeFnExample(
        "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1)})"
      ),
      makeFnExample("Dist.logScore({estimate: Sym.normal(5,2), answer: 4.5})"),
    ],
    definitions: [
      makeDefinition(
        [frDist, frDist],
        frDict(["score", frNumber], ["shape", frDist]),
        ([estimate, answer], reducer) => {
          const shape = logScoreDistAnswer({
            estimate,
            answer,
            env: reducer.environment,
          });
          return {
            score: shape.integralSum(),
            shape: new PointSetDist(shape),
          };
        }
      ),
    ],
  }),
];
