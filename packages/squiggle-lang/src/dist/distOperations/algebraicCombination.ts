import * as magicNumbers from "../../magicNumbers.js";
import * as Operation from "../../operation.js";
import { AlgebraicOperation } from "../../operation.js";
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
import * as SampleSetDist from "../SampleSetDist/index.js";
import * as SymbolicDist from "../SymbolicDist.js";
import { Env } from "../env.js";

// Checks if operation is possible, returns undefined if everything is ok.
const validateInputs = (
  t1: BaseDist,
  t2: BaseDist,
  arithmeticOperation: AlgebraicOperation
): DistError | undefined => {
  /*
     It would be good to also do a check to make sure that probability mass for the second
     operand, at value 1.0, is 0 (or approximately 0). However, we'd ideally want to check
     that both the probability mass and the probability density are greater than zero.
     Right now we don't yet have a way of getting probability mass, so I'll leave this for later.
 */
  const getLogarithmInputError = (): DistError | undefined => {
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
  };

  if (arithmeticOperation == "Logarithm") {
    return getLogarithmInputError();
  } else {
    return undefined;
  }
};

type CombinationArgs = {
  t1: BaseDist;
  t2: BaseDist;
  env: Env;
  arithmeticOperation: AlgebraicOperation;
};

type StrategyImplementation = (
  args: CombinationArgs
) => result<BaseDist, DistError> | undefined;

const symbolicStrategy: StrategyImplementation = ({
  t1,
  t2,
  arithmeticOperation,
}) => {
  if (
    t1 instanceof SymbolicDist.SymbolicDist &&
    t2 instanceof SymbolicDist.SymbolicDist
  ) {
    const result = SymbolicDist.tryAnalyticalSimplification(
      t1,
      t2,
      arithmeticOperation
    );
    return result ? Result.errMap(result, operationDistError) : undefined;
  } else {
    return undefined;
  }
};

const convolutionStrategy: StrategyImplementation = ({
  env,
  arithmeticOperation,
  t1,
  t2,
}) => {
  const convOp =
    Operation.Convolution.fromAlgebraicOperation(arithmeticOperation);
  if (convOp === undefined) {
    return undefined;
  }

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

  return Result.Ok(PointSetDist.combineAlgebraically(convOp, p1, p2));
};

const monteCarloStrategy: StrategyImplementation = ({
  env,
  arithmeticOperation,
  t1,
  t2,
}) => {
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
};

const preferConvolutionToMonteCarlo = (args: CombinationArgs): boolean => {
  const hasSampleSetDist = () =>
    args.t1 instanceof SampleSetDist.SampleSetDist ||
    args.t2 instanceof SampleSetDist.SampleSetDist;

  const convolutionIsFasterThanMonteCarlo = () =>
    args.t1.expectedConvolutionCost() * args.t2.expectedConvolutionCost() <
    args.env.sampleCount;

  return (
    !hasSampleSetDist() &&
    Operation.Convolution.canDoAlgebraicOperation(args.arithmeticOperation) &&
    convolutionIsFasterThanMonteCarlo()
  );
};

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution.
*/
export const algebraicCombination = (
  args: CombinationArgs
): result<BaseDist, DistError> => {
  const invalidOperationError = validateInputs(
    args.t1,
    args.t2,
    args.arithmeticOperation
  );

  if (invalidOperationError !== undefined) {
    return Result.Err(invalidOperationError);
  }

  const maybeSymbolicResult = symbolicStrategy(args);
  if (maybeSymbolicResult) {
    return maybeSymbolicResult;
  }

  const strategy = preferConvolutionToMonteCarlo(args)
    ? convolutionStrategy
    : monteCarloStrategy;

  return strategy(args) ?? Result.Err(unreachableError());
};
