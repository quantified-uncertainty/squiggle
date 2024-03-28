import { ComplexNumberError, OperationError } from "../../operationError.js";
import * as Mixed from "../../PointSet/Mixed.js";
import * as Result from "../../utility/result.js";
import { ResultC } from "../../utility/ResultC.js";

const logFn = Math.log; // base e

type SumParams = {
  estimate: Mixed.MixedShape;
  answer: Mixed.MixedShape;
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

export const integralSumDistribution = ({
  estimate,
  answer,
}: SumParams): ResultC<Mixed.MixedShape, OperationError> => {
  try {
    return ResultC.fromType(
      Mixed.combinePointwise(
        estimate.toMixed(),
        answer.toMixed(),
        pdfPointScore
      )
    );
  } catch (error) {
    return ResultC.err(error as OperationError);
  }
};
