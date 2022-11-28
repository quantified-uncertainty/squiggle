import { Ok, result } from "./utility/result";
import * as Result from "./utility/result";
import {
  ComplexNumberError,
  DivisionByZeroError,
  NegativeInfinityError,
  OperationError,
} from "./OperationError";

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
  //Only a selection of operations are supported by convolution.
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

export const power = (a: number, b: number): result<number, OperationError> => {
  if (a >= 0) {
    return Ok(a ** b);
  } else {
    return Result.Error(ComplexNumberError);
  }
};

export const divide = (
  a: number,
  b: number
): result<number, OperationError> => {
  if (b !== 0) {
    return Ok(a / b);
  } else {
    return Result.Error(DivisionByZeroError);
  }
};

export const logarithm = (
  a: number,
  b: number
): result<number, OperationError> => {
  if (b === 1) {
    return Result.Error(DivisionByZeroError);
  } else if (b === 0) {
    return Ok(0);
  } else if (a > 0 && b > 0) {
    return Ok(Math.log(a) / Math.log(b));
  } else if (a === 0) {
    return Result.Error(NegativeInfinityError);
  } else {
    return Result.Error(ComplexNumberError);
  }
};

export const Algebraic = {
  toFn(
    x: AlgebraicOperation,
    a: number,
    b: number
  ): result<number, OperationError> {
    if (x === "Add") {
      return Ok(a + b);
    } else if (x === "Subtract") {
      return Ok(a - b);
    } else if (x === "Multiply") {
      return Ok(a * b);
    } else if (x === "Power") {
      return power(a, b);
    } else if (x === "Divide") {
      return divide(a, b);
    } else if (x === "Logarithm") {
      return logarithm(a, b);
    } else if (x.NAME === "LogarithmWithThreshold") {
      if (a < x.VAL) {
        return Ok(0);
      } else {
        return logarithm(a, b);
      }
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
  toFn(
    x: ScaleOperation,
    a: number,
    b: number
  ): result<number, OperationError> {
    if (x === "Multiply") {
      return Ok(a * b);
    } else if (x === "Divide") {
      return divide(a, b);
    } else if (x === "Power") {
      return power(a, b);
    } else if (x === "Logarithm") {
      return logarithm(a, b);
    } else if (x.NAME === "LogarithmWithThreshold") {
      if (a < x.VAL) {
        return Ok(0);
      } else {
        return logarithm(a, b);
      }
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

  toIntegralCacheFn(x: ScaleOperation): undefined {
    // TODO: in case of "Multiply" this could probably just be multiplied out (using Continuous.scaleBy)
    return undefined;
  },
};
