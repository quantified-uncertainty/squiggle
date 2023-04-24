import * as PointSetDist_Scoring from "../../PointSet/PointSetDist_Scoring.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, operationDistError } from "../DistError.js";
import { Env } from "../env.js";

export function logScoreDistAnswer({
  estimate,
  answer,
  prior,
  env,
}: {
  estimate: BaseDist;
  answer: BaseDist;
  prior: BaseDist | undefined;
  env: Env;
}): result<number, DistError> {
  return Result.bind(estimate.toPointSetDist(env), (estimate2) => {
    return Result.bind(answer.toPointSetDist(env), (answer2) => {
      const prior2 = prior?.toPointSetDist(env);
      if (prior2) {
        if (!prior2.ok) {
          return prior2;
        } else {
          const prior3 = prior2.value;
          return Result.errMap(
            PointSetDist_Scoring.WithDistAnswer.sumWithPrior({
              estimate: estimate2.pointSet,
              answer: answer2.pointSet,
              prior: prior3.pointSet,
            }),
            (y) => operationDistError(y)
          );
        }
      } else {
        return Result.errMap(
          PointSetDist_Scoring.WithDistAnswer.sum({
            estimate: estimate2.pointSet,
            answer: answer2.pointSet,
          }),
          (y) => operationDistError(y)
        );
      }
    });
  });
}

export function logScoreScalarAnswer({
  estimate,
  answer,
  prior,
  env,
}: {
  estimate: BaseDist;
  answer: number;
  prior: BaseDist | undefined;
  env: Env;
}): result<number, DistError> {
  return Result.bind(estimate.toPointSetDist(env), (estimate2) => {
    const prior2 = prior?.toPointSetDist(env);
    if (prior2) {
      if (!prior2.ok) {
        return prior2;
      } else {
        const prior3 = prior2.value;
        return Result.errMap(
          PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior({
            estimate: estimate2.pointSet,
            answer,
            prior: prior3.pointSet,
          }),
          operationDistError
        );
      }
    } else {
      return Result.errMap(
        PointSetDist_Scoring.WithScalarAnswer.score({
          estimate: estimate2.pointSet,
          answer,
        }),
        operationDistError
      );
    }
  });
}
