import { ComplexNumberError, OperationError } from "../../operationError.js";
import * as Mixed from "../../PointSet/Mixed.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, operationDistError } from "../DistError.js";
import { Env } from "../env.js";

const logFn = Math.log; // base e

type MinusScaledLogOfQuotientParams = {
  esti: number;
  answ: number;
};

type SumParams = {
  estimate: Mixed.MixedShape;
  answer: Mixed.MixedShape;
};

type SumWithPriorParams = {
  estimate: Mixed.MixedShape;
  answer: Mixed.MixedShape;
  prior: Mixed.MixedShape;
};

type LogScoreDistAnswerParams = {
  estimate: BaseDist;
  answer: BaseDist;
  prior: BaseDist | undefined;
  env: Env;
};

/**
 * Calculates the minus scaled log of the quotient.
 * @param {MinusScaledLogOfQuotientParams} params - The minus scaled log of quotient parameters.
 * @returns {Result.result<number, OperationError>} The calculated result.
 */
function minusScaledLogOfQuotient({
  esti,
  answ,
}: MinusScaledLogOfQuotientParams): Result.result<number, OperationError> {
  const quot = esti / answ;

  if (quot < 0.0) {
    //THis should not be possible. All distributions should have positive mass.
    return Result.Err(new ComplexNumberError());
  }

  return Result.Ok(-answ * logFn(quot));
}

/**
 * Calculates the Kullback-Leibler divergence integrand.
 * @param {number} estimateElement - The estimate element.
 * @param {number} answerElement - The answer element.
 * @returns {Result.result<number, OperationError>} The calculated integrand result.
 */
const integrand = (
  estimateElement: number,
  answerElement: number
): Result.result<number, OperationError> => {
  if (answerElement === 0) {
    return Result.Ok(0);
  }

  if (estimateElement === 0) {
    return Result.Ok(Infinity);
  }

  return minusScaledLogOfQuotient({
    esti: estimateElement,
    answ: answerElement,
  });
};

/**
 * Calculates the sum of the estimate and answer point sets.
 * @param {SumParams} params - The sum parameters.
 * @returns {Result.result<number, OperationError>} The calculated sum result.
 */
export const sum = ({
  estimate,
  answer,
}: SumParams): Result.result<number, OperationError> => {
  try {
    const combinedResult = Mixed.combinePointwise(
      estimate.toMixed(),
      answer.toMixed(),
      integrand
    );
    return Result.fmap(combinedResult, (t) => t.integralSum());
  } catch (error) {
    return Result.Err(error as OperationError);
  }
};

/**
 * Calculates the sum with prior of the estimate, answer, and prior point sets.
 * @param {SumWithPriorParams} params - The sum with prior parameters.
 * @returns {Result.result<number, OperationError>} The calculated sum with prior result.
 */
export const sumWithPrior = ({
  estimate,
  answer,
  prior,
}: SumWithPriorParams): Result.result<number, OperationError> => {
  const kl1 = sum({ estimate, answer });
  const kl2 = sum({ estimate: prior, answer });
  return Result.fmap(Result.merge(kl1, kl2), ([v1, v2]) => v1 - v2);
};

/**
 * Calculates the log score for a distribution answer.
 * @param {LogScoreDistAnswerParams} params - The log score distribution answer parameters.
 * @returns {result<number, DistError>} The calculated log score result.
 */
export function logScoreDistAnswer({
  estimate,
  answer,
  prior,
  env,
}: LogScoreDistAnswerParams): result<number, DistError> {
  const estimateResult = estimate.toPointSetDist(env);
  if (!estimateResult.ok) {
    return estimateResult;
  }

  const answerResult = answer.toPointSetDist(env);
  if (!answerResult.ok) {
    return answerResult;
  }

  if (!prior) {
    return Result.errMap(
      sum({
        estimate: estimateResult.value.pointSet,
        answer: answerResult.value.pointSet,
      }),
      operationDistError
    );
  }

  const priorResult = prior.toPointSetDist(env);
  if (!priorResult.ok) {
    return priorResult;
  }

  return Result.errMap(
    sumWithPrior({
      estimate: estimateResult.value.pointSet,
      answer: answerResult.value.pointSet,
      prior: priorResult.value.pointSet,
    }),
    operationDistError
  );
}
