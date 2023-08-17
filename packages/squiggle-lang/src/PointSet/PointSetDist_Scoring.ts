import {
  ComplexNumberError,
  OperationError,
  PdfInvalidError,
} from "../operationError.js";
import * as Result from "../utility/result.js";
import * as Mixed from "./Mixed.js";
import { MixedPoint } from "./MixedPoint.js";
import { AnyPointSet } from "./PointSet.js";

const logFn = Math.log; // base e
function minusScaledLogOfQuotient({
  esti,
  answ,
}: {
  esti: number;
  answ: number;
}): Result.result<number, OperationError> {
  const quot = esti / answ;
  return quot < 0.0
    ? Result.Err(new ComplexNumberError())
    : Result.Ok(-answ * logFn(quot));
}

export const WithDistAnswer = {
  // The Kullback-Leibler divergence
  integrand(
    estimateElement: number,
    answerElement: number
  ): Result.result<number, OperationError> {
    // We decided that 0.0, not an error at answerElement = 0.0, is a desirable value.
    if (answerElement === 0) {
      return Result.Ok(0);
    } else if (estimateElement === 0) {
      return Result.Ok(Infinity);
    } else {
      return minusScaledLogOfQuotient({
        esti: estimateElement,
        answ: answerElement,
      });
    }
  },

  sum({
    estimate,
    answer,
  }: {
    estimate: AnyPointSet;
    answer: AnyPointSet;
  }): Result.result<number, OperationError> {
    return Result.fmap(
      Mixed.combinePointwise(
        estimate.toMixed(),
        answer.toMixed(),
        WithDistAnswer.integrand
      ),
      (t) => t.integralSum()
    );
  },

  sumWithPrior({
    estimate,
    answer,
    prior,
  }: {
    estimate: AnyPointSet;
    answer: AnyPointSet;
    prior: AnyPointSet;
  }): Result.result<number, OperationError> {
    const kl1 = WithDistAnswer.sum({ estimate, answer });
    const kl2 = WithDistAnswer.sum({ estimate: prior, answer });
    return Result.fmap(Result.merge(kl1, kl2), ([v1, v2]) => v1 - v2);
  },
};

export const WithScalarAnswer = {
  sum(mp: MixedPoint): number {
    return mp.continuous + mp.discrete;
  },
  score({
    estimate,
    answer,
  }: {
    estimate: Mixed.MixedShape;
    answer: number;
  }): Result.result<number, OperationError> {
    const _score = (
      estimatePdf: (x: number) => number | undefined,
      answer: number
    ): Result.result<number, OperationError> => {
      const density = estimatePdf(answer);
      if (density === undefined) {
        return Result.Err(new PdfInvalidError());
      } else if (density < 0) {
        return Result.Err(new PdfInvalidError());
      } else if (density === 0) {
        return Result.Ok(Infinity);
      } else {
        return Result.Ok(-logFn(density));
      }
    };
    const estimatePdf = (x: number) => {
      if (estimate.toContinuous().isEmpty()) {
        return WithScalarAnswer.sum(estimate.toDiscrete().xToY(x));
      } else if (estimate.toDiscrete().isEmpty()) {
        return WithScalarAnswer.sum(estimate.toContinuous().xToY(x));
      } else {
        return undefined;
      }
    };
    return _score(estimatePdf, answer);
  },
  scoreWithPrior({
    estimate,
    answer,
    prior,
  }: {
    estimate: Mixed.MixedShape;
    answer: number;
    prior: Mixed.MixedShape;
  }): Result.result<number, OperationError> {
    return Result.fmap(
      Result.merge(
        WithScalarAnswer.score({ estimate, answer }),
        WithScalarAnswer.score({ estimate: prior, answer })
      ),
      ([s1, s2]) => s1 - s2
    );
  },
};
