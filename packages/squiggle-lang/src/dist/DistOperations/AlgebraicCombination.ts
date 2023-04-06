import * as magicNumbers from "../../magicNumbers.js";
import * as Operation from "../../operation.js";
import { AlgebraicOperation } from "../../operation.js";
import { OperationError } from "../../operationError.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import {
  DistError,
  logarithmOfDistributionError,
  operationDistError,
  unreachableError,
} from "../DistError.js";
import * as PointSetDist from "../PointSetDist.js";
import * as SampleSetDist from "../SampleSetDist/SampleSetDist.js";
import * as SymbolicDist from "../SymbolicDist.js";
import { Env } from "../env.js";

export enum AlgebraicCombinationStrategy {
  AsSymbolic,
  AsMonteCarlo,
  AsConvolution,
}

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution.
*/
const InputValidator = {
  /*
     It would be good to also do a check to make sure that probability mass for the second
     operand, at value 1.0, is 0 (or approximately 0). However, we'd ideally want to check
     that both the probability mass and the probability density are greater than zero.
     Right now we don't yet have a way of getting probability mass, so I'll leave this for later.
 */
  getLogarithmInputError(t1: BaseDist, t2: BaseDist): DistError | undefined {
    const isDistNotGreaterThanZero = (t: BaseDist) =>
      t.cdf(magicNumbers.Epsilon.ten) > 0;

    if (isDistNotGreaterThanZero(t1)) {
      return logarithmOfDistributionError(
        "First input must be completely greater than 0"
      );
    }
    if (isDistNotGreaterThanZero(t2)) {
      return logarithmOfDistributionError(
        "Second input must be completely greater than 0"
      );
    }
    return undefined;
  },

  run(
    t1: BaseDist,
    t2: BaseDist,
    arithmeticOperation: AlgebraicOperation
  ): DistError | undefined {
    if (arithmeticOperation == "Logarithm") {
      return InputValidator.getLogarithmInputError(t1, t2);
    } else {
      return undefined;
    }
  },
};

const StrategyCallOnValidatedInputs = {
  convolution: (
    env: Env,
    arithmeticOperation: Operation.ConvolutionOperation,
    t1: BaseDist,
    t2: BaseDist
  ): result<PointSetDist.PointSetDist, DistError> => {
    const p1r = t1.toPointSetDist(env);
    const p2r = t2.toPointSetDist(env);
    if (!p1r.ok) {
      return p1r;
    }
    if (!p2r.ok) {
      return p2r;
    }
    const p1 = p1r.value;
    const p2 = p2r.value;

    return Result.Ok(
      PointSetDist.combineAlgebraically(arithmeticOperation, p1, p2)
    );
  },

  monteCarlo(
    env: Env,
    arithmeticOperation: AlgebraicOperation,
    t1: BaseDist,
    t2: BaseDist
  ): result<SampleSetDist.SampleSetDist, DistError> {
    const fn = Operation.Algebraic.toFn(arithmeticOperation);
    const s1r = SampleSetDist.SampleSetDist.fromDist(t1, env);
    const s2r = SampleSetDist.SampleSetDist.fromDist(t2, env);
    if (!s1r.ok) {
      return s1r;
    }
    if (!s2r.ok) {
      return s2r;
    }
    const s1 = s1r.value;
    const s2 = s2r.value;
    return SampleSetDist.map2({ fn, t1: s1, t2: s2 });
  },

  symbolic(
    arithmeticOperation: AlgebraicOperation,
    t1: BaseDist,
    t2: BaseDist
  ): result<SymbolicDist.SymbolicDist, OperationError> | undefined {
    if (
      t1 instanceof SymbolicDist.SymbolicDist &&
      t2 instanceof SymbolicDist.SymbolicDist
    ) {
      return SymbolicDist.tryAnalyticalSimplification(
        t1,
        t2,
        arithmeticOperation
      );
    } else {
      return undefined;
    }
  },
};

const chooseStrategy = ({
  t1,
  t2,
  arithmeticOperation,
}: {
  t1: BaseDist;
  t2: BaseDist;
  arithmeticOperation: AlgebraicOperation;
}): AlgebraicCombinationStrategy => {
  const hasSampleSetDist = (): boolean =>
    t1 instanceof SampleSetDist.SampleSetDist ||
    t2 instanceof SampleSetDist.SampleSetDist;

  const convolutionIsFasterThanMonteCarlo = (): boolean =>
    t1.expectedConvolutionCost() * t2.expectedConvolutionCost() <
    magicNumbers.OpCost.monteCarloCost;

  const preferConvolutionToMonteCarlo = () =>
    !hasSampleSetDist() &&
    Operation.Convolution.canDoAlgebraicOperation(arithmeticOperation) &&
    convolutionIsFasterThanMonteCarlo();

  if (
    StrategyCallOnValidatedInputs.symbolic(arithmeticOperation, t1, t2) !==
    undefined
  ) {
    return AlgebraicCombinationStrategy.AsSymbolic;
  } else {
    return preferConvolutionToMonteCarlo()
      ? AlgebraicCombinationStrategy.AsConvolution
      : AlgebraicCombinationStrategy.AsMonteCarlo;
  }
};

const runStrategyOnValidatedInputs = ({
  t1,
  t2,
  arithmeticOperation,
  strategy,
  env,
}: {
  t1: BaseDist;
  t2: BaseDist;
  arithmeticOperation: AlgebraicOperation;
  strategy: AlgebraicCombinationStrategy;
  env: Env;
}): result<BaseDist, DistError> => {
  switch (strategy) {
    case AlgebraicCombinationStrategy.AsMonteCarlo:
      return StrategyCallOnValidatedInputs.monteCarlo(
        env,
        arithmeticOperation,
        t1,
        t2
      );
    case AlgebraicCombinationStrategy.AsSymbolic:
      const result = StrategyCallOnValidatedInputs.symbolic(
        arithmeticOperation,
        t1,
        t2
      );
      if (result === undefined) {
        return Result.Error(unreachableError());
      }
      if (!result.ok) {
        return Result.Error(operationDistError(result.value));
      }
      return result;
    case AlgebraicCombinationStrategy.AsConvolution:
      const convOp =
        Operation.Convolution.fromAlgebraicOperation(arithmeticOperation);
      if (convOp === undefined) {
        return Result.Error(unreachableError());
      }
      return StrategyCallOnValidatedInputs.convolution(env, convOp, t1, t2);
  }
};

export const algebraicCombination = ({
  t1,
  t2,
  env,
  arithmeticOperation,
}: {
  t1: BaseDist;
  t2: BaseDist;
  env: Env;
  arithmeticOperation: AlgebraicOperation;
}): result<BaseDist, DistError> => {
  const invalidOperationError = InputValidator.run(t1, t2, arithmeticOperation);

  if (invalidOperationError !== undefined) {
    return Result.Error(invalidOperationError);
  }

  const chosenStrategy = chooseStrategy({
    arithmeticOperation,
    t1,
    t2,
  });
  return runStrategyOnValidatedInputs({
    t1,
    t2,
    strategy: chosenStrategy,
    arithmeticOperation,
    env,
  });
};
