import { AlgebraicOperation } from "../../operation";
import { rsResult } from "../../rsResult";
import * as RSResult from "../../rsResult";
import * as Operation from "../../operation";
import * as E_A_Floats from "../../utility/E_A_Floats";
import * as PointSetDist from "../PointSetDist";
import * as PointSetDist_Scoring from "../../PointSet/PointSetDist_Scoring";
import { BaseDist } from "../BaseDist";
import {
  DistError,
  distributionVerticalShiftIsInvalid,
  operationDistError,
  otherError,
} from "../DistError";
import {
  algebraicCombination,
  AsAlgebraicCombinationStrategy,
} from "./AlgebraicCombination";
import { Env } from "../env";
import * as SampleSetDist from "../SampleSetDist/SampleSetDist";
import { OperationError } from "../../OperationError";
import { ContinuousShape } from "../../PointSet/Continuous";

export const toSampleSetDist = (d: BaseDist, env: Env) => {
  return SampleSetDist.SampleSetDist.make(d.sampleN(env.sampleCount));
};

export const logScoreDistAnswer = ({
  estimate,
  answer,
  prior,
  env,
}: {
  estimate: BaseDist;
  answer: BaseDist;
  prior: BaseDist | undefined;
  env: Env;
}): rsResult<number, DistError> => {
  return RSResult.bind(estimate.toPointSetDist(env), (estimate2) => {
    return RSResult.bind(answer.toPointSetDist(env), (answer2) => {
      const prior2 = prior?.toPointSetDist(env);
      if (prior2) {
        if (prior2.TAG === RSResult.E.Error) {
          return prior2;
        } else {
          const prior3 = prior2._0;
          return RSResult.errMap(
            PointSetDist_Scoring.WithDistAnswer.sumWithPrior({
              estimate: estimate2.pointSet,
              answer: answer2.pointSet,
              prior: prior3.pointSet,
            }),
            (y) => operationDistError(y)
          );
        }
      } else {
        return RSResult.errMap(
          PointSetDist_Scoring.WithDistAnswer.sum({
            estimate: estimate2.pointSet,
            answer: answer2.pointSet,
          }),
          (y) => operationDistError(y)
        );
      }
    });
  });
};

export const logScoreScalarAnswer = ({
  estimate,
  answer,
  prior,
  env,
}: {
  estimate: BaseDist;
  answer: number;
  prior: BaseDist | undefined;
  env: Env;
}): rsResult<number, DistError> => {
  return RSResult.bind(estimate.toPointSetDist(env), (estimate2) => {
    const prior2 = prior?.toPointSetDist(env);
    if (prior2) {
      if (prior2.TAG === RSResult.E.Error) {
        return prior2;
      } else {
        const prior3 = prior2._0;
        return RSResult.errMap(
          PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior({
            estimate: estimate2.pointSet,
            answer,
            prior: prior3.pointSet,
          }),
          operationDistError
        );
      }
    } else {
      return RSResult.errMap(
        PointSetDist_Scoring.WithScalarAnswer.score({
          estimate: estimate2.pointSet,
          answer,
        }),
        operationDistError
      );
    }
  });
};

//TODO: Add faster pointwiseCombine fn
const pointwiseCombination = (
  t1: BaseDist,
  {
    env,
    algebraicCombination,
    t2,
  }: {
    env: Env;
    algebraicCombination: AlgebraicOperation;
    t2: BaseDist;
  }
): rsResult<BaseDist, DistError> => {
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

  const result = PointSetDist.combinePointwise(p1, p2, (a: number, b: number) =>
    Operation.Algebraic.toFn(algebraicCombination, a, b)
  );
  if (result.TAG === RSResult.E.Ok) {
    return result;
  } else {
    return RSResult.Error(operationDistError(result._0));
  }
};

export const pointwiseCombinationFloat = (
  t: BaseDist,
  {
    env,
    algebraicCombination,
    f,
  }: {
    env: Env;
    algebraicCombination: AlgebraicOperation;
    f: number;
  }
): rsResult<BaseDist, DistError> => {
  const executeCombination = (arithOp: Operation.ScaleOperation) =>
    RSResult.bind(t.toPointSetDist(env), (t) => {
      // TODO: Move to PointSet codebase
      // FIXME: performance issues
      const integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(arithOp);
      const integralCacheFn =
        Operation.Scale.toIntegralCacheFn(arithOp) ??
        ((a: number, b: ContinuousShape) => undefined);
      return RSResult.errMap(
        t.mapYResult<OperationError>(
          (y) => Operation.Scale.toFn(arithOp, y, f),
          (v) => integralSumCacheFn?.(f, v),
          (v) => integralCacheFn(f, v)
        ),
        (e: OperationError) => operationDistError(e)
      );
    });

  if (algebraicCombination === "Add" || algebraicCombination === "Subtract") {
    return RSResult.Error(distributionVerticalShiftIsInvalid());
  } else if (
    algebraicCombination === "Multiply" ||
    algebraicCombination === "Divide" ||
    algebraicCombination === "Power" ||
    algebraicCombination === "Logarithm"
  ) {
    return executeCombination(algebraicCombination);
  } else if (algebraicCombination.NAME === "LogarithmWithThreshold") {
    return executeCombination(algebraicCombination);
  } else {
    throw new Error(`Unknown AlgebraicOperation ${algebraicCombination}`);
  }
};

export const scaleLog = (t: BaseDist, f: number, { env }: { env: Env }) =>
  pointwiseCombinationFloat(t, { env, algebraicCombination: "Logarithm", f });

//TODO: The result should always cumulatively sum to 1. This would be good to test.
//TODO: If the inputs are not normalized, this will return poor results. The weights probably refer to the post-normalized forms. It would be good to apply a catch to this.
export const mixture = (
  values: [BaseDist, number][],
  { env }: { env: Env }
): rsResult<BaseDist, DistError> => {
  const scaleMultiplyFn = (dist: BaseDist, weight: number) =>
    pointwiseCombinationFloat(dist, {
      env,
      algebraicCombination: "Multiply",
      f: weight,
    });

  const pointwiseAddFn = (dist1: BaseDist, dist2: BaseDist) =>
    pointwiseCombination(dist1, {
      env,
      algebraicCombination: "Add",
      t2: dist2,
    });

  const allValuesAreSampleSet = (v: [BaseDist, number][]) =>
    v.every(([t]) => t instanceof SampleSetDist.SampleSetDist);

  if (values.length < 1) {
    return RSResult.Error(
      otherError("Mixture error: mixture must have at least 1 element")
    );
  } else if (allValuesAreSampleSet(values)) {
    const withSampleSetValues = values.map(([value, weight]) => {
      if (value instanceof SampleSetDist.SampleSetDist) {
        return [value, weight] as [SampleSetDist.SampleSetDist, number];
      } else {
        throw new Error(
          "Mixture coding error: SampleSet expected. This should be inaccessible."
        );
      }
    });
    return SampleSetDist.mixture(withSampleSetValues, env.sampleCount);
  } else {
    const totalWeight = E_A_Floats.sum(values.map(([, w]) => w));
    const properlyWeightedValues: BaseDist[] = [];
    for (const [dist, weight] of values) {
      const r = scaleMultiplyFn(dist, weight / totalWeight);
      if (r.TAG === RSResult.E.Error) {
        return r;
      }
      properlyWeightedValues.push(r._0);
    }

    let answer = properlyWeightedValues[0];
    for (const dist of properlyWeightedValues.slice(1)) {
      const r = pointwiseAddFn(answer, dist);
      if (r.TAG === RSResult.E.Error) {
        return r;
      }
      answer = r._0;
    }
    return RSResult.Ok(answer);
  }
};

export type BinaryOperation = (
  t1: BaseDist,
  t2: BaseDist,
  opts: { env: Env }
) => rsResult<BaseDist, DistError>;

// private helpers
const algebraic = (
  dist1: BaseDist,
  dist2: BaseDist,
  env: Env,
  operation: AlgebraicOperation
) =>
  algebraicCombination(dist1, {
    strategy: AsAlgebraicCombinationStrategy.AsDefault,
    arithmeticOperation: operation,
    env,
    t2: dist2,
  });

const pointwise = (
  dist1: BaseDist,
  dist2: BaseDist,
  env: Env,
  operation: AlgebraicOperation
) =>
  pointwiseCombination(dist1, {
    env,
    algebraicCombination: operation,
    t2: dist2,
  });

export const BinaryOperations: { [k: string]: BinaryOperation } = {
  algebraicAdd: (t1, t2, { env }) => algebraic(t1, t2, env, "Add"),
  algebraicMultiply: (t1, t2, { env }) => algebraic(t1, t2, env, "Multiply"),
  algebraicDivide: (t1, t2, { env }) => algebraic(t1, t2, env, "Divide"),
  algebraicSubtract: (t1, t2, { env }) => algebraic(t1, t2, env, "Subtract"),
  algebraicLogarithm: (t1, t2, { env }) => algebraic(t1, t2, env, "Logarithm"),
  algebraicPower: (t1, t2, { env }) => algebraic(t1, t2, env, "Power"),

  pointwiseAdd: (t1, t2, { env }) => pointwise(t1, t2, env, "Add"),
  pointwiseMultiply: (t1, t2, { env }) => pointwise(t1, t2, env, "Multiply"),
  pointwiseDivide: (t1, t2, { env }) => pointwise(t1, t2, env, "Divide"),
  pointwiseSubtract: (t1, t2, { env }) => pointwise(t1, t2, env, "Subtract"),
  pointwiseLogarithm: (t1, t2, { env }) => pointwise(t1, t2, env, "Logarithm"),
  pointwisePower: (t1, t2, { env }) => pointwise(t1, t2, env, "Power"),
};
