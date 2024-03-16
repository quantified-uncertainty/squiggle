import { OperationError, PdfInvalidError } from "../../operationError.js";
import * as Mixed from "../../PointSet/Mixed.js";
import { Err, Ok, result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, operationDistError } from "../DistError.js";
import { Env } from "../env.js";

const logFn = Math.log; // base e

type ScoreParams = {
  estimate: Mixed.MixedShape;
  answer: number;
};

type ScoreWithPriorParams = {
  estimate: Mixed.MixedShape;
  answer: number;
  prior: Mixed.MixedShape;
};

type LogScoreScalarAnswerParams = {
  estimate: BaseDist;
  prior: BaseDist | undefined;
  answer: number;
  env: Env;
};

/**
 * Calculates the score for the given estimate and answer.
 * @param {ScoreParams} params - The score parameters.
 * @returns {number} The calculated score.
 */
export const score = ({ estimate, answer }: ScoreParams): number => {
  const calculateScore = (
    estimatePdf: (x: number) => number | undefined,
    answer: number
  ): number => {
    const density = estimatePdf(answer);

    if (density === undefined) {
      throw new PdfInvalidError();
    }

    if (density < 0) {
      throw new PdfInvalidError();
    }

    if (density === 0) {
      return Infinity;
    }

    return -logFn(density);
  };

  const getEstimatePdf = (x: number) => {
    if (estimate.toContinuous().isEmpty()) {
      return estimate.toDiscrete().xToY(x).discrete;
    }

    if (estimate.toDiscrete().isEmpty()) {
      return estimate.toContinuous().xToY(x).continuous;
    }

    return undefined;
  };

  return calculateScore(getEstimatePdf, answer);
};

/**
 * Calculates the score with prior for the given estimate, answer, and prior.
 * @param {ScoreWithPriorParams} params - The score with prior parameters.
 * @returns {number} The calculated score with prior.
 */
export const scoreWithPrior = ({
  estimate,
  answer,
  prior,
}: ScoreWithPriorParams): number => {
  const s1 = score({ estimate, answer });
  const s2 = score({ estimate: prior, answer });
  return s1 - s2;
};

/**
 * Calculates the log score for a scalar answer.
 * @param {LogScoreScalarAnswerParams} params - The log score scalar answer parameters.
 * @returns {result<number, DistError>} The calculated log score.
 */
export function logScoreScalarAnswer({
  estimate,
  prior,
  answer,
  env,
}: LogScoreScalarAnswerParams): result<number, DistError> {
  const estimateR = estimate.toPointSetDist(env);
  if (!estimateR.ok) {
    return estimateR;
  }

  if (!prior) {
    try {
      return Ok(score({ estimate: estimateR.value.pointSet, answer }));
    } catch (error) {
      return Err(operationDistError(error as OperationError));
    }
  }

  const priorR = prior.toPointSetDist(env);
  if (!priorR.ok) {
    return priorR;
  }

  try {
    return Ok(
      scoreWithPrior({
        estimate: estimateR.value.pointSet,
        answer,
        prior: priorR.value.pointSet,
      })
    );
  } catch (error) {
    return Err(operationDistError(error as OperationError));
  }
}
