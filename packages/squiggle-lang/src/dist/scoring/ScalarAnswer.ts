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

type LogScoreScalarAnswerParams = {
  estimate: BaseDist;
  prior: BaseDist | undefined;
  answer: number;
  env: Env;
};

export const scoreWithoutPrior = ({
  estimate,
  answer,
}: ScoreParams): number => {
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
      return Ok(
        scoreWithoutPrior({ estimate: estimateR.value.pointSet, answer })
      );
    } catch (error) {
      return Err(operationDistError(error as OperationError));
    }
  }

  const priorR = prior.toPointSetDist(env);
  if (!priorR.ok) {
    return priorR;
  }

  try {
    const s1 = scoreWithoutPrior({
      estimate: estimateR.value.pointSet,
      answer,
    });
    const s2 = scoreWithoutPrior({ estimate: priorR.value.pointSet, answer });
    return Ok(s1 - s2);
  } catch (error) {
    return Err(operationDistError(error as OperationError));
  }
}
