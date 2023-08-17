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
  const estimateResult = estimate.toPointSetDist(env);
  if (!estimateResult.ok) {
    return estimateResult;
  }
  const estimate2 = estimateResult.value;

  const answerResult = answer.toPointSetDist(env);
  if (!answerResult.ok) {
    return answerResult;
  }
  const answer2 = answerResult.value;

  if (!prior) {
    return Result.errMap(
      PointSetDist_Scoring.WithDistAnswer.sum({
        estimate: estimate2.pointSet,
        answer: answer2.pointSet,
      }),
      (y) => operationDistError(y)
    );
  }

  const priorResult = prior?.toPointSetDist(env);
  if (!priorResult.ok) {
    return priorResult;
  }
  const prior2 = priorResult.value;

  return Result.errMap(
    PointSetDist_Scoring.WithDistAnswer.sumWithPrior({
      estimate: estimate2.pointSet,
      answer: answer2.pointSet,
      prior: prior2.pointSet,
    }),
    operationDistError
  );
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
  const estimateResult = estimate.toPointSetDist(env);
  if (!estimateResult.ok) {
    return estimateResult;
  }
  const estimate2 = estimateResult.value;

  if (!prior) {
    return Result.errMap(
      PointSetDist_Scoring.WithScalarAnswer.score({
        estimate: estimate2.pointSet,
        answer,
      }),
      operationDistError
    );
  }

  const priorResult = prior.toPointSetDist(env);
  if (!priorResult.ok) {
    return priorResult;
  }
  const prior2 = priorResult.value;

  return Result.errMap(
    PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior({
      estimate: estimate2.pointSet,
      answer,
      prior: prior2.pointSet,
    }),
    operationDistError
  );
}
