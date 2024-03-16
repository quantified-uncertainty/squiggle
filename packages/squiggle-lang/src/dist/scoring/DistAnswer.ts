import { ComplexNumberError, OperationError } from "../../operationError.js";
import * as Mixed from "../../PointSet/Mixed.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, operationDistError } from "../DistError.js";
import { Env } from "../env.js";

const logFn = Math.log; // base e

type SumParams = {
  estimate: Mixed.MixedShape;
  answer: Mixed.MixedShape;
};

type LogScoreDistAnswerParams = {
  estimate: BaseDist;
  answer: BaseDist;
  prior: BaseDist | undefined;
  env: Env;
};

const pdfPointScore = (
  estimateElement: number,
  answerElement: number
): Result.result<number, OperationError> => {
  if (answerElement === 0) {
    return Result.Ok(0);
  }

  //TODO: Might want to raise here or return an error, to halt the code immediately.
  if (estimateElement === 0) {
    return Result.Ok(Infinity);
  }

  if (estimateElement < 0 || answerElement < 0) {
    return Result.Err(new ComplexNumberError());
  }

  const quot = estimateElement / answerElement;
  return Result.Ok(-answerElement * logFn(quot));
};

export const integralSumWithoutPrior = ({
  estimate,
  answer,
}: SumParams): Result.result<number, OperationError> => {
  try {
    const combinedResult = Mixed.combinePointwise(
      estimate.toMixed(),
      answer.toMixed(),
      pdfPointScore
    );
    return Result.fmap(combinedResult, (t) => t.integralSum());
  } catch (error) {
    return Result.Err(error as OperationError);
  }
};

export function logScoreDistAnswer({
  estimate,
  answer,
  prior,
  env,
}: LogScoreDistAnswerParams): result<number, DistError> {
  const estimateR = estimate.toPointSetDist(env);
  if (!estimateR.ok) {
    return estimateR;
  }

  const answerR = answer.toPointSetDist(env);
  if (!answerR.ok) {
    return answerR;
  }

  if (!prior) {
    return Result.errMap(
      integralSumWithoutPrior({
        estimate: estimateR.value.pointSet,
        answer: answerR.value.pointSet,
      }),
      operationDistError
    );
  }

  const priorR = prior.toPointSetDist(env);
  if (!priorR.ok) {
    return priorR;
  }

  const kl1 = integralSumWithoutPrior({
    estimate: estimateR.value.pointSet,
    answer: answerR.value.pointSet,
  });
  const kl2 = integralSumWithoutPrior({
    estimate: priorR.value.pointSet,
    answer: answerR.value.pointSet,
  });
  return Result.errMap(
    Result.fmap(Result.merge(kl1, kl2), ([v1, v2]) => v1 - v2),
    operationDistError
  );
}
