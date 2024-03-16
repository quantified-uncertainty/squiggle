import { ComplexNumberError, OperationError } from "../../operationError.js";
import * as Mixed from "../../PointSet/Mixed.js";
import * as Result from "../../utility/result.js";
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
}: SumParams): Result.Result<number, OperationError> => {
  try {
    const combinedResult = Mixed.combinePointwise(
      estimate.toMixed(),
      answer.toMixed(),
      pdfPointScore
    );
    return Result.Result.fromType(combinedResult).fmap((t) => t.integralSum());
  } catch (error) {
    return Result.Result.err(error as OperationError);
  }
};

export function logScoreDistAnswer({
  estimate,
  answer,
  prior,
  env,
}: LogScoreDistAnswerParams): Result.Result<number, DistError> {
  const estimateR = Result.Result.fromType(estimate.toPointSetDist(env));
  const answerR = Result.Result.fromType(answer.toPointSetDist(env));

  const estimateKullbackLeiberDivergence = estimateR.flatMap((estimateValue) =>
    answerR.flatMap((answerValue) =>
      integralSumWithoutPrior({
        estimate: estimateValue.pointSet,
        answer: answerValue.pointSet,
      }).errMap(operationDistError)
    )
  );

  if (!prior) {
    return estimateKullbackLeiberDivergence;
  }

  const priorR = Result.Result.fromType(prior.toPointSetDist(env));

  const priorKullbackLeiberDivergence = priorR.flatMap((priorValue) =>
    answerR.flatMap((answerValue) =>
      integralSumWithoutPrior({
        estimate: priorValue.pointSet,
        answer: answerValue.pointSet,
      }).errMap((error) => error as DistError)
    )
  );

  return estimateKullbackLeiberDivergence.flatMap((v1) =>
    priorKullbackLeiberDivergence
      .fmap((v2) => v1 - v2)
      .errMap(operationDistError)
  );
}
