import {
  ComplexNumberError,
  OperationError,
  OtherOperationError,
  PdfInvalidError,
} from "../operationError";
import * as Result from "../utility/result";
import { MixedPoint } from "./MixedPoint";
import {
  AnyPointSet,
  combinePointwise,
  isContinuous,
  isDiscrete,
} from "./PointSet";

const logFn = Math.log; // base e
const minusScaledLogOfQuotient = ({
  esti,
  answ,
}: {
  esti: number;
  answ: number;
}): Result.result<number, OperationError> => {
  const quot = esti / answ;
  return quot < 0.0
    ? Result.Error(ComplexNumberError)
    : Result.Ok(-answ * logFn(quot));
};

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
    const combineAndIntegrate = (estimate: AnyPointSet, answer: AnyPointSet) =>
      Result.fmap(
        combinePointwise(estimate, answer, WithDistAnswer.integrand),
        (t) => t.integralEndY()
      );

    const getMixedSums = (
      estimate: AnyPointSet,
      answer: AnyPointSet
    ): Result.result<[number, number], OperationError> => {
      const esti = estimate.toMixed();
      const answ = answer.toMixed();
      const estiContinuousPart = esti.toContinuous();
      const estiDiscretePart = esti.toDiscrete();
      const answContinuousPart = answ.toContinuous();
      const answDiscretePart = answ.toDiscrete();
      if (
        estiContinuousPart &&
        estiDiscretePart &&
        answContinuousPart &&
        answDiscretePart
      ) {
        return Result.merge(
          combineAndIntegrate(estiDiscretePart, answDiscretePart),
          combineAndIntegrate(estiContinuousPart, answContinuousPart)
        );
      } else {
        return Result.Error(new OtherOperationError("unreachable state"));
      }
    };

    if (
      (isContinuous(estimate) && isContinuous(answer)) ||
      (isDiscrete(estimate) && isDiscrete(answer))
    ) {
      return combineAndIntegrate(estimate, answer);
    } else {
      return Result.fmap(
        getMixedSums(estimate, answer),
        ([discretePart, continuousPart]) => discretePart + continuousPart
      );
    }
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
    let kl1 = WithDistAnswer.sum({
      estimate,
      answer,
    });
    let kl2 = WithDistAnswer.sum({
      estimate: prior,
      answer,
    });
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
    estimate: AnyPointSet;
    answer: number;
  }): Result.result<number, OperationError> {
    const _score = (
      estimatePdf: (x: number) => number | undefined,
      answer: number
    ): Result.result<number, OperationError> => {
      const density = estimatePdf(answer);
      if (density === undefined) {
        return Result.Error(PdfInvalidError);
      } else {
        if (density < 0) {
          return Result.Error(PdfInvalidError);
        } else if (density === 0) {
          return Result.Ok(Infinity);
        } else {
          return Result.Ok(-logFn(density));
        }
      }
    };
    const estimatePdf = (x: number) => {
      if (isContinuous(estimate) || isDiscrete(estimate)) {
        return WithScalarAnswer.sum(estimate.xToY(x));
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
    estimate: AnyPointSet;
    answer: number;
    prior: AnyPointSet;
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
