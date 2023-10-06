import { BaseDist } from "../dist/BaseDist.js";
import * as distOperations from "../dist/distOperations/index.js";
import { Env } from "../dist/env.js";
import { REArgumentError, REDistributionError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frDist, frDistOrNumber, frDict } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
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
  const result = distOperations.logScoreScalarAnswer({
    estimate,
    answer,
    prior,
    env,
  });
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return vNumber(result.value);
};

const runScoringDistAnswer = (
  estimate: BaseDist,
  answer: BaseDist,
  prior: BaseDist | undefined,
  env: Env
) => {
  const result = distOperations.logScoreDistAnswer({
    estimate,
    answer,
    prior,
    env,
  });
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return vNumber(result.value);
};

export const library = [
  maker.make({
    name: "logScore",
    output: "Number",
    examples: [
      "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1), prior: Sym.normal(5.5,3)})",
      "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1)})",
      "Dist.logScore({estimate: Sym.normal(5,2), answer: 4.5})",
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
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
            throw new REArgumentError("Impossible type");
          }
        }
      ),
      makeDefinition(
        [frDict(["estimate", frDist], ["answer", frDistOrNumber])],
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
            throw new REArgumentError("Impossible type");
          }
        }
      ),
    ],
  }),
  maker.make({
    name: "klDivergence",
    output: "Number",
    examples: ["Dist.klDivergence(Sym.normal(5,2), Sym.normal(5,1.5))"],
    definitions: [
      makeDefinition([frDist, frDist], ([estimate, d], context) =>
        runScoringDistAnswer(estimate, d, undefined, context.environment)
      ),
    ],
  }),
];
