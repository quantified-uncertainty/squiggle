import { ContinuousShape } from "../../PointSet/Continuous.js";
import * as Operation from "../../operation.js";
import { AlgebraicOperation } from "../../operation.js";
import { OperationError } from "../../operationError.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import {
  DistError,
  distributionVerticalShiftIsInvalid,
  operationDistError,
} from "../DistError.js";
import * as PointSetDist from "../PointSetDist.js";
import { Env } from "../env.js";

//TODO: Add faster pointwiseCombine fn
export function pointwiseCombination({
  t1,
  t2,
  env,
  algebraicOperation,
}: {
  t1: BaseDist;
  t2: BaseDist;
  env: Env;
  algebraicOperation: AlgebraicOperation;
}): result<BaseDist, DistError> {
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

  const result = PointSetDist.combinePointwise(
    p1,
    p2,
    Operation.Algebraic.toFn(algebraicOperation)
  );
  if (result.ok) {
    return result;
  } else {
    return Result.Err(operationDistError(result.value));
  }
}

export function pointwiseCombinationFloat(
  t: BaseDist,
  {
    env,
    algebraicOperation,
    f,
  }: {
    env: Env;
    algebraicOperation: AlgebraicOperation;
    f: number;
  }
): result<BaseDist, DistError> {
  const executeCombination = (arithOp: Operation.ScaleOperation) =>
    Result.bind(t.toPointSetDist(env), (t) => {
      // TODO: Move to PointSet codebase
      // FIXME: performance issues
      const integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(arithOp);
      const integralCacheFn =
        Operation.Scale.toIntegralCacheFn(arithOp) ??
        ((a: number, b: ContinuousShape) => undefined);

      const opFn = Operation.Scale.toFn(arithOp);
      return Result.errMap(
        t.mapYResult<OperationError>(
          (y) => opFn(y, f),
          (v) => integralSumCacheFn?.(f, v),
          (v) => integralCacheFn(f, v)
        ),
        (e: OperationError) => operationDistError(e)
      );
    });

  if (algebraicOperation === "Add" || algebraicOperation === "Subtract") {
    return Result.Err(distributionVerticalShiftIsInvalid());
  } else if (
    algebraicOperation === "Multiply" ||
    algebraicOperation === "Divide" ||
    algebraicOperation === "Power" ||
    algebraicOperation === "Logarithm"
  ) {
    return executeCombination(algebraicOperation);
  } else if (algebraicOperation.NAME === "LogarithmWithThreshold") {
    return executeCombination(algebraicOperation);
  } else {
    throw new Error(`Unknown AlgebraicOperation ${algebraicOperation}`);
  }
}
