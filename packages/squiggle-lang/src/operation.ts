import { Ok, result } from "./utility/result.js";
import * as Result from "./utility/result.js";
import {
  ComplexNumberError,
  DivisionByZeroError,
  NegativeInfinityError,
  OperationError,
} from "./operationError.js";

// matches algebraicOperation from Operation.res
export type AlgebraicOperation =
  | "Add"
  | "Multiply"
  | "Subtract"
  | "Divide"
  | "Power"
  | "Logarithm"
  | {
      NAME: "LogarithmWithThreshold";
      VAL: number;
    };

export type ConvolutionOperation = "Add" | "Multiply" | "Subtract";

export const Convolution = {
  // Only a selection of operations are supported by convolution.
  fromAlgebraicOperation(
    op: AlgebraicOperation
  ): ConvolutionOperation | undefined {
    if (op === "Add" || op === "Subtract" || op === "Multiply") {
      return op;
    }
    return undefined;
  },
  canDoAlgebraicOperation(op: AlgebraicOperation): boolean {
    return Convolution.fromAlgebraicOperation(op) !== undefined;
  },
  toFn(t: ConvolutionOperation): (a: number, b: number) => number {
    switch (t) {
      case "Add":
        return (a, b) => a + b;
      case "Subtract":
        return (a, b) => a - b;
      case "Multiply":
        return (a, b) => a * b;
      default:
        throw new Error("This should never happen");
    }
  },
};

type OperationFn = (a: number, b: number) => result<number, OperationError>;

const power: OperationFn = (a, b) => {
  const result = a ** b;
  if (Number.isNaN(result)) {
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return Ok(result); // bad, but the issue is upstream of `power` operation
    }
    return Result.Err(new ComplexNumberError());
  }
  return Ok(result);
};

const add: OperationFn = (a, b) => Ok(a + b);

const subtract: OperationFn = (a, b) => Ok(a - b);

const multiply: OperationFn = (a, b) => Ok(a * b);

const divide: OperationFn = (a, b) => {
  if (b !== 0) {
    return Ok(a / b);
  } else {
    return Result.Err(new DivisionByZeroError());
  }
};

const logarithm: OperationFn = (a, b) => {
  if (b === 1) {
    return Result.Err(new DivisionByZeroError());
  } else if (b === 0) {
    return Ok(0);
  } else if (a > 0 && b > 0) {
    return Ok(Math.log(a) / Math.log(b));
  } else if (a === 0) {
    return Result.Err(new NegativeInfinityError());
  } else {
    return Result.Err(new ComplexNumberError());
  }
};

const buildLogarithmWithThreshold = (threshold: number) => {
  const fn: OperationFn = (a, b) => {
    if (a < threshold) {
      return Ok(0);
    } else {
      return logarithm(a, b);
    }
  };
  return fn;
};

export const Algebraic = {
  toFn(x: AlgebraicOperation): OperationFn {
    if (x === "Add") {
      return add;
    } else if (x === "Subtract") {
      return subtract;
    } else if (x === "Multiply") {
      return multiply;
    } else if (x === "Power") {
      return power;
    } else if (x === "Divide") {
      return divide;
    } else if (x === "Logarithm") {
      return logarithm;
    } else if (x.NAME === "LogarithmWithThreshold") {
      return buildLogarithmWithThreshold(x.VAL);
    } else {
      throw new Error(`Unknown operation ${x}`);
    }
  },

  toString(x: AlgebraicOperation) {
    if (x === "Add") {
      return "+";
    } else if (x === "Subtract") {
      return "-";
    } else if (x === "Multiply") {
      return "*";
    } else if (x === "Power") {
      return "**";
    } else if (x === "Divide") {
      return "/";
    } else if (x === "Logarithm") {
      return "log";
    } else if (x.NAME === "LogarithmWithThreshold") {
      return "log";
    } else {
      // never
      throw new Error(`Unknown operation ${x}`);
    }
  },
};

export type ScaleOperation =
  | "Multiply"
  | "Power"
  | "Logarithm"
  | { NAME: "LogarithmWithThreshold"; VAL: number }
  | "Divide";

// // Note that different logarithms don't really do anything.
export const Scale = {
  toFn(x: ScaleOperation): OperationFn {
    if (x === "Multiply") {
      return multiply;
    } else if (x === "Divide") {
      return divide;
    } else if (x === "Power") {
      return power;
    } else if (x === "Logarithm") {
      return logarithm;
    } else if (x.NAME === "LogarithmWithThreshold") {
      return buildLogarithmWithThreshold(x.VAL);
    } else {
      throw new Error(`Unknown scale operation ${x}`);
    }
  },

  toIntegralSumCacheFn(
    x: ScaleOperation
  ): ((a: number, b: number) => number) | undefined {
    if (x === "Multiply") {
      return (a: number, b: number) => a * b;
    } else if (x === "Divide") {
      return (a: number, b: number) => a / b;
    } else {
      return undefined;
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toIntegralCacheFn(x: ScaleOperation): undefined {
    // TODO: in case of "Multiply" this could probably just be multiplied out (using Continuous.scaleBy)
    return undefined;
  },
};
