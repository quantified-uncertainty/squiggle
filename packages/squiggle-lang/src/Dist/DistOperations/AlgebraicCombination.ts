import {
  DistError,
  logarithmOfDistributionError,
  operationDistError,
  requestedStrategyInvalidError,
  unreachableError,
} from "../DistError";
import * as magicNumbers from "../../magicNumbers";
import { rsResult } from "../../rsResult";
import * as RSResult from "../../rsResult";
import * as Operation from "../../operation";
import { BaseDist } from "../BaseDist";
import { AlgebraicOperation } from "../../operation";
import * as PointSetDist from "../PointSetDist";
import * as SampleSetDist from "../SampleSetDist/SampleSetDist";
import * as SymbolicDist from "../SymbolicDist";
import { OperationError } from "../../OperationError";
import { Env } from "../env";

export enum AsAlgebraicCombinationStrategy {
  AsDefault,
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
  ): rsResult<PointSetDist.PointSetDist, DistError> => {
    const p1r = t1.toPointSetDist(env);
    const p2r = t2.toPointSetDist(env);
    if (p1r.TAG === RSResult.E.Error) {
      return p1r;
    }
    if (p2r.TAG === RSResult.E.Error) {
      return p2r;
    }
    const p1 = p1r._0;
    const p2 = p2r._0;

    return RSResult.Ok(
      PointSetDist.combineAlgebraically(arithmeticOperation, p1, p2)
    );
  },

  monteCarlo(
    env: Env,
    arithmeticOperation: AlgebraicOperation,
    t1: BaseDist,
    t2: BaseDist
  ): rsResult<SampleSetDist.SampleSetDist, DistError> {
    const fn = (a: number, b: number) =>
      Operation.Algebraic.toFn(arithmeticOperation, a, b);
    const s1r = SampleSetDist.SampleSetDist.fromDist(t1, env);
    const s2r = SampleSetDist.SampleSetDist.fromDist(t2, env);
    if (s1r.TAG === RSResult.E.Error) {
      return s1r;
    }
    if (s2r.TAG === RSResult.E.Error) {
      return s2r;
    }
    const s1 = s1r._0;
    const s2 = s2r._0;
    return SampleSetDist.map2({ fn, t1: s1, t2: s2 });
  },

  symbolic(
    arithmeticOperation: AlgebraicOperation,
    t1: BaseDist,
    t2: BaseDist
  ): rsResult<SymbolicDist.SymbolicDist, OperationError> | undefined {
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

type SpecificStrategy = "AsSymbolic" | "AsMonteCarlo" | "AsConvolution";

const StrategyChooser = {
  hasSampleSetDist: (t1: BaseDist, t2: BaseDist): boolean =>
    t1 instanceof SampleSetDist.SampleSetDist ||
    t2 instanceof SampleSetDist.SampleSetDist,

  convolutionIsFasterThanMonteCarlo: (t1: BaseDist, t2: BaseDist): boolean =>
    t1.expectedConvolutionCost() * t2.expectedConvolutionCost() <
    magicNumbers.OpCost.monteCarloCost,

  preferConvolutionToMonteCarlo: (
    t1: BaseDist,
    t2: BaseDist,
    arithmeticOperation: AlgebraicOperation
  ) => {
    return (
      !StrategyChooser.hasSampleSetDist(t1, t2) &&
      Operation.Convolution.canDoAlgebraicOperation(arithmeticOperation) &&
      StrategyChooser.convolutionIsFasterThanMonteCarlo(t1, t2)
    );
  },

  run({
    t1,
    t2,
    arithmeticOperation,
  }: {
    t1: BaseDist;
    t2: BaseDist;
    arithmeticOperation: AlgebraicOperation;
  }): SpecificStrategy {
    if (
      StrategyCallOnValidatedInputs.symbolic(arithmeticOperation, t1, t2) !==
      undefined
    ) {
      return "AsSymbolic";
    } else {
      return StrategyChooser.preferConvolutionToMonteCarlo(
        t1,
        t2,
        arithmeticOperation
      )
        ? "AsConvolution"
        : "AsMonteCarlo";
    }
  },
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
  strategy: SpecificStrategy;
  env: Env;
}): rsResult<BaseDist, DistError> => {
  switch (strategy) {
    case "AsMonteCarlo":
      return StrategyCallOnValidatedInputs.monteCarlo(
        env,
        arithmeticOperation,
        t1,
        t2
      );
    case "AsSymbolic":
      const result = StrategyCallOnValidatedInputs.symbolic(
        arithmeticOperation,
        t1,
        t2
      );
      if (result === undefined) {
        return RSResult.Error(unreachableError());
      }
      if (result.TAG === RSResult.E.Error) {
        return RSResult.Error(operationDistError(result._0));
      }
      return result;
    case "AsConvolution":
      const convOp =
        Operation.Convolution.fromAlgebraicOperation(arithmeticOperation);
      if (convOp === undefined) {
        return RSResult.Error(unreachableError());
      }
      return StrategyCallOnValidatedInputs.convolution(env, convOp, t1, t2);
  }
};

const run = (
  t1: BaseDist,
  {
    strategy,
    env,
    arithmeticOperation,
    t2,
  }: {
    strategy: AsAlgebraicCombinationStrategy;
    env: Env;
    arithmeticOperation: AlgebraicOperation;
    t2: BaseDist;
  }
): rsResult<BaseDist, DistError> => {
  const invalidOperationError = InputValidator.run(t1, t2, arithmeticOperation);

  if (invalidOperationError !== undefined) {
    return RSResult.Error(invalidOperationError);
  }

  switch (strategy) {
    case AsAlgebraicCombinationStrategy.AsDefault:
      const chooseStrategy = StrategyChooser.run({
        arithmeticOperation,
        t1,
        t2,
      });
      return runStrategyOnValidatedInputs({
        t1,
        t2,
        strategy: chooseStrategy,
        arithmeticOperation,
        env,
      });
    case AsAlgebraicCombinationStrategy.AsMonteCarlo:
      return StrategyCallOnValidatedInputs.monteCarlo(
        env,
        arithmeticOperation,
        t1,
        t2
      );
    case AsAlgebraicCombinationStrategy.AsSymbolic:
      const result = StrategyCallOnValidatedInputs.symbolic(
        arithmeticOperation,
        t1,
        t2
      );
      if (result === undefined) {
        return RSResult.Error(
          requestedStrategyInvalidError(`No analytic solution for inputs`)
        );
      }
      if (result.TAG === RSResult.E.Error) {
        return RSResult.Error(operationDistError(result._0));
      }
      return result;
    case AsAlgebraicCombinationStrategy.AsConvolution:
      const convOp =
        Operation.Convolution.fromAlgebraicOperation(arithmeticOperation);
      if (convOp === undefined) {
        const errString = `Convolution not supported for ${Operation.Algebraic.toString(
          arithmeticOperation
        )}`;
        return RSResult.Error(requestedStrategyInvalidError(errString));
      } else {
        return StrategyCallOnValidatedInputs.convolution(env, convOp, t1, t2);
      }
  }
};

export const algebraicCombination = run;
