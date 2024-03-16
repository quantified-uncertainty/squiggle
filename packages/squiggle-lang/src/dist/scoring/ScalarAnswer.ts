import { OperationError, PdfInvalidError } from "../../operationError.js";
import * as Mixed from "../../PointSet/Mixed.js";
import { Result } from "../../utility/result.js";
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
}: LogScoreScalarAnswerParams): Result<number, DistError> {
  const estimateR = estimate.toPointSetDist(env);
  if (!estimateR.ok) {
    return Result.err(estimateR.value);
  }

  if (!prior) {
    try {
      return Result.ok(
        scoreWithoutPrior({ estimate: estimateR.value.pointSet, answer })
      );
    } catch (error) {
      return Result.err(operationDistError(error as OperationError));
    }
  }

  const priorR = prior.toPointSetDist(env);
  if (!priorR.ok) {
    return Result.err(priorR.value);
  }

  try {
    const s1 = scoreWithoutPrior({
      estimate: estimateR.value.pointSet,
      answer,
    });
    const s2 = scoreWithoutPrior({ estimate: priorR.value.pointSet, answer });
    return Result.ok(s1 - s2);
  } catch (error) {
    return Result.err(operationDistError(error as OperationError));
  }
}
