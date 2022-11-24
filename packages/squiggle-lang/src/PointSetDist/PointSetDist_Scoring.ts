import {
  ComplexNumberError,
  makeOtherError,
  OperationError,
  PdfInvalidError,
} from "../OperationError";
import * as RSResult from "../rsResult";
import * as Mixed from "./Mixed";
import { MixedPoint } from "./MixedPoint";
import * as PointSetDist from "./PointSetDist";

const logFn = Math.log; // base e
const minusScaledLogOfQuotient = ({
  esti,
  answ,
}: {
  esti: number;
  answ: number;
}): RSResult.rsResult<number, OperationError> => {
  const quot = esti / answ;
  return quot < 0.0
    ? RSResult.Error(ComplexNumberError)
    : RSResult.Ok(-answ * logFn(quot));
};

export const WithDistAnswer = {
  // The Kullback-Leibler divergence
  integrand(
    estimateElement: number,
    answerElement: number
  ): RSResult.rsResult<number, OperationError> {
    // We decided that 0.0, not an error at answerElement = 0.0, is a desirable value.
    if (answerElement === 0) {
      return RSResult.Ok(0);
    } else if (estimateElement === 0) {
      return RSResult.Ok(Infinity);
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
    estimate: PointSetDist.PointSetDist;
    answer: PointSetDist.PointSetDist;
  }): RSResult.rsResult<number, OperationError> {
    const combineAndIntegrate = (
      estimate: PointSetDist.PointSetDist,
      answer: PointSetDist.PointSetDist
    ) =>
      RSResult.fmap(
        PointSetDist.combinePointwise(
          estimate,
          answer,
          WithDistAnswer.integrand
        ),
        PointSetDist.T.integralEndY
      );

    const getMixedSums = (
      estimate: PointSetDist.PointSetDist,
      answer: PointSetDist.PointSetDist
    ): RSResult.rsResult<[number, number], OperationError> => {
      const esti = PointSetDist.T.toMixed(estimate);
      const answ = PointSetDist.T.toMixed(answer);
      const estiContinuousPart = Mixed.T.toContinuous(esti);
      const estiDiscretePart = Mixed.T.toDiscrete(esti);
      const answContinuousPart = Mixed.T.toContinuous(answ);
      const answDiscretePart = Mixed.T.toDiscrete(answ);
      if (
        estiContinuousPart &&
        estiDiscretePart &&
        answContinuousPart &&
        answDiscretePart
      ) {
        return RSResult.merge(
          combineAndIntegrate(
            PointSetDist.makeDiscrete(estiDiscretePart),
            PointSetDist.makeDiscrete(answDiscretePart)
          ),
          combineAndIntegrate(
            PointSetDist.makeContinuous(estiContinuousPart),
            PointSetDist.makeContinuous(answContinuousPart)
          )
        );
      } else {
        return RSResult.Error(makeOtherError("unreachable state"));
      }
    };

    if (
      (PointSetDist.isContinuous(estimate) &&
        PointSetDist.isContinuous(answer)) ||
      (PointSetDist.isDiscrete(estimate) && PointSetDist.isDiscrete(answer))
    ) {
      return combineAndIntegrate(estimate, answer);
    } else {
      return RSResult.fmap(
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
    estimate: PointSetDist.PointSetDist;
    answer: PointSetDist.PointSetDist;
    prior: PointSetDist.PointSetDist;
  }): RSResult.rsResult<number, OperationError> {
    let kl1 = WithDistAnswer.sum({
      estimate,
      answer,
    });
    let kl2 = WithDistAnswer.sum({
      estimate: prior,
      answer,
    });
    return RSResult.fmap(RSResult.merge(kl1, kl2), ([v1, v2]) => v1 - v2);
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
    estimate: PointSetDist.PointSetDist;
    answer: number;
  }): RSResult.rsResult<number, OperationError> {
    const _score = (
      estimatePdf: (x: number) => number | undefined,
      answer: number
    ): RSResult.rsResult<number, OperationError> => {
      const density = estimatePdf(answer);
      if (density === undefined) {
        return RSResult.Error(PdfInvalidError);
      } else {
        if (density < 0) {
          return RSResult.Error(PdfInvalidError);
        } else if (density === 0) {
          return RSResult.Ok(Infinity);
        } else {
          return RSResult.Ok(-logFn(density));
        }
      }
    };
    const estimatePdf = (x: number) => {
      if (
        PointSetDist.isContinuous(estimate) ||
        PointSetDist.isDiscrete(estimate)
      ) {
        return WithScalarAnswer.sum(PointSetDist.T.xToY(x, estimate));
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
    estimate: PointSetDist.PointSetDist;
    answer: number;
    prior: PointSetDist.PointSetDist;
  }): RSResult.rsResult<number, OperationError> {
    return RSResult.fmap(
      RSResult.merge(
        WithScalarAnswer.score({ estimate, answer }),
        WithScalarAnswer.score({ estimate: prior, answer })
      ),
      ([s1, s2]) => s1 - s2
    );
  },
};

// let twoGenericDistsToTwoPointSetDists = (~toPointSetFn, estimate, answer): result<
//   (pointSetDist, pointSetDist),
//   'e,
// > => E.R.merge(toPointSetFn(estimate, ()), toPointSetFn(answer, ()))

// let logScore = (args: scoreArgs, ~combineFn, ~integrateFn, ~toMixedFn): result<
//   score,
//   Operation.Error.t,
// > =>
//   switch args {
//   | DistAnswer({estimate, answer, prior: None}) =>
//     WithDistAnswer.sum(~estimate, ~answer, ~integrateFn, ~combineFn, ~toMixedFn)
//   | DistAnswer({estimate, answer, prior: Some(prior)}) =>
//     WithDistAnswer.sumWithPrior(~estimate, ~answer, ~prior, ~integrateFn, ~combineFn, ~toMixedFn)
//   | ScalarAnswer({estimate, answer, prior: None}) => WithScalarAnswer.score(~estimate, ~answer)
//   | ScalarAnswer({estimate, answer, prior: Some(prior)}) =>
//     WithScalarAnswer.scoreWithPrior(~estimate, ~answer, ~prior)
//   }
