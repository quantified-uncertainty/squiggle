import { BaseDist } from "../dist/BaseDist.js";
import * as distOperations from "../dist/distOperations/index.js";
import { Env } from "../dist/env.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDist,
  frDistOrNumber,
  frRecord,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { REDistributionError, REOther } from "../errors.js";
import * as Result from "../utility/result.js";
import { vNumber } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: true,
});

const runScoringScalarAnswer = (
  estimate: BaseDist,
  answer: number,
  prior: BaseDist | undefined,
  env: Env
) => {
  return Result.fmap2(
    distOperations.logScoreScalarAnswer({ estimate, answer, prior, env }),
    vNumber,
    (e) => new REDistributionError(e)
  );
};

const runScoringDistAnswer = (
  estimate: BaseDist,
  answer: BaseDist,
  prior: BaseDist | undefined,
  env: Env
) => {
  return Result.fmap2(
    distOperations.logScoreDistAnswer({ estimate, answer, prior, env }),
    vNumber,
    (e) => new REDistributionError(e)
  );
};

export const library = [
  maker.make({
    name: "logScore",
    output: "Number",
    examples: [
      "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1), prior: normal(5.5,3)})",
      "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1)})",
      "Dist.logScore({estimate: normal(5,2), answer: 4.5})",
    ],
    definitions: [
      makeDefinition(
        [
          frRecord(
            ["estimate", frDist],
            ["answer", frDistOrNumber],
            ["prior", frDist]
          ),
        ],
        ([{ estimate, answer, prior }], context) => {
          if (answer instanceof BaseDist) {
            return runScoringDistAnswer(
              estimate,
              answer,
              prior,
              context.environment
            );
          } else if (typeof answer === "number") {
            return runScoringScalarAnswer(
              estimate,
              answer,
              prior,
              context.environment
            );
          } else {
            throw new REOther("Impossible type");
          }
        }
      ),
      makeDefinition(
        [frRecord(["estimate", frDist], ["answer", frDistOrNumber])],
        ([{ estimate, answer }], context) => {
          if (answer instanceof BaseDist) {
            return runScoringDistAnswer(
              estimate,
              answer,
              undefined,
              context.environment
            );
          } else if (typeof answer === "number") {
            return runScoringScalarAnswer(
              estimate,
              answer,
              undefined,
              context.environment
            );
          } else {
            throw new REOther("Impossible type");
          }
        }
      ),
    ],
  }),
  maker.make({
    name: "klDivergence",
    output: "Number",
    examples: ["Dist.klDivergence(normal(5,2), normal(5,1.5))"],
    definitions: [
      makeDefinition([frDist, frDist], ([estimate, d], context) =>
        runScoringDistAnswer(estimate, d, undefined, context.environment)
      ),
    ],
  }),
];
