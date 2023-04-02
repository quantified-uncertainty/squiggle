import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDist,
  frDistOrNumber,
  frRecord,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vNumber } from "../value/index.js";
import * as Result from "../utility/result.js";
import * as DistOperations from "../dist/DistOperations/index.js";
import { BaseDist } from "../dist/BaseDist.js";
import { Env } from "../dist/env.js";
import {
  ErrorMessage,
  REDistributionError,
  REOther,
} from "../reducer/ErrorMessage.js";

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
    DistOperations.logScoreScalarAnswer({ estimate, answer, prior, env }),
    vNumber,
    REDistributionError
  );
};

const runScoringDistAnswer = (
  estimate: BaseDist,
  answer: BaseDist,
  prior: BaseDist | undefined,
  env: Env
) => {
  return Result.fmap2(
    DistOperations.logScoreDistAnswer({ estimate, answer, prior, env }),
    vNumber,
    REDistributionError
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
        "logScore",
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
            return ErrorMessage.throw(REOther("Impossible type"));
          }
        }
      ),
      makeDefinition(
        "logScore",
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
            return ErrorMessage.throw(REOther("Impossible type"));
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
      makeDefinition(
        "klDivergence",
        [frDist, frDist],
        ([estimate, d], context) =>
          runScoringDistAnswer(estimate, d, undefined, context.environment)
      ),
    ],
  }),
];
