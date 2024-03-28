import { OperationError, PdfInvalidError } from "../../operationError.js";
import { ResultC } from "../../utility/ResultC.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, operationDistError } from "../DistError.js";
import { Env } from "../env.js";

const logFn = Math.log; // base e

type ScoreValues = {
  discrete: number;
  continuous: number;
};

const pointValueToScore = (pointValue: number): number => {
  if (pointValue === undefined) {
    throw new PdfInvalidError();
  }

  if (pointValue < 0) {
    throw new PdfInvalidError();
  }

  if (pointValue === 0) {
    return Infinity;
  }

  return -logFn(pointValue);
};

type LogScoreScalarAnswerParams = {
  estimate: BaseDist;
  answer: number;
  env: Env;
};

export function logScoreScalarAnswer({
  estimate,
  answer,
  env,
}: LogScoreScalarAnswerParams): ResultC<ScoreValues, DistError> {
  const estimateR = estimate.toPointSetDist(env);
  if (!estimateR.ok) {
    return ResultC.err(estimateR.value);
  }

  try {
    const scores = {
      discrete: estimateR.value.pointSet.toDiscrete().xToY(answer).discrete,
      continuous: estimateR.value.pointSet.toContinuous().xToY(answer)
        .continuous,
    };
    return ResultC.ok({
      discrete: pointValueToScore(scores.discrete),
      continuous: pointValueToScore(scores.continuous),
    });
  } catch (error) {
    return ResultC.err(operationDistError(error as OperationError));
  }
}
