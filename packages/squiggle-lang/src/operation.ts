import { Ok, rsResult } from "./rsResult";
import * as RSResult from "./rsResult";
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

// type ConvolutionOperation = "Add" | "Multiply" | "Subtract";
// type PointwiseOperation = "Add" | "Multiply" | "Power";
// type ScaleOperation = "Multiply" | "Power" | "Logarithm" | { NAME: "LogarithmWithThreshold", VAL: number } | "Divide";

// module Convolution = {
//   type t = convolutionOperation
//   //Only a selection of operations are supported by convolution.
//   let fromAlgebraicOperation = (op: AlgebraicOperation): option<convolutionOperation> =>
//     switch op {
//     | #Add => Some(#Add)
//     | #Subtract => Some(#Subtract)
//     | #Multiply => Some(#Multiply)
//     | #Divide | #Power | #Logarithm | #LogarithmWithThreshold(_) => None
//     }

//   let canDoAlgebraicOperation = (op: AlgebraicOperation): bool =>
//     fromAlgebraicOperation(op)->E.O.isSome

//   let toFn: (t, float, float) => float = x =>
//     switch x {
//     | #Add => \"+."
//     | #Subtract => \"-."
//     | #Multiply => \"*."
//     }
// }

export const power = (
  a: number,
  b: number
): rsResult<number, OperationError> => {
  if (a >= 0) {
    return Ok(a ** b);
  } else {
    return RSResult.Error(ComplexNumberError);
  }
};

export const divide = (
  a: number,
  b: number
): rsResult<number, OperationError> => {
  if (b !== 0) {
    return Ok(a / b);
  } else {
    return RSResult.Error(DivisionByZeroError);
  }
};

export const logarithm = (
  a: number,
  b: number
): rsResult<number, OperationError> => {
  if (b === 1) {
    return RSResult.Error(DivisionByZeroError);
  } else if (b === 0) {
    return Ok(0);
  } else if (a > 0 && b > 0) {
    return Ok(Math.log(a) / Math.log(b));
  } else if (a === 0) {
    return RSResult.Error(NegativeInfinityError);
  } else {
    return RSResult.Error(ComplexNumberError);
  }
};

export const Algebraic = {
  toFn(
    x: AlgebraicOperation,
    a: number,
    b: number
  ): rsResult<number, OperationError> {
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

  // let toString = x =>
  //   switch x {
  //   | #Add => "+"
  //   | #Subtract => "-"
  //   | #Multiply => "*"
  //   | #Power => "**"
  //   | #Divide => "/"
  //   | #Logarithm => "log"
  //   | #LogarithmWithThreshold(_) => "log"
  //   }

  // let format = (a, b, c) => b ++ (" " ++ (toString(a) ++ (" " ++ c)))
};

// module Pointwise = {
//   type t = pointwiseOperation
//   let toString = x =>
//     switch x {
//     | #Add => "+"
//     | #Power => "**"
//     | #Multiply => "*"
//     }

//   let format = (a, b, c) => b ++ (" " ++ (toString(a) ++ (" " ++ c)))
// }

// // Note that different logarithms don't really do anything.
// module Scale = {
//   type t = scaleOperation
//   let toFn = (x: t, a: float, b: float): result<float, Error.t> =>
//     switch x {
//     | #Multiply => Ok(a *. b)
//     | #Divide => divide(a, b)
//     | #Power => power(a, b)
//     | #Logarithm => logarithm(a, b)
//     | #LogarithmWithThreshold(eps) =>
//       if a < eps {
//         Ok(0.0)
//       } else {
//         logarithm(a, b)
//       }
//     }

//   let format = (operation: t, value, scaleBy) =>
//     switch operation {
//     | #Multiply => j`verticalMultiply($value, $scaleBy) `
//     | #Divide => j`verticalDivide($value, $scaleBy) `
//     | #Power => j`verticalPower($value, $scaleBy) `
//     | #Logarithm => j`verticalLog($value, $scaleBy) `
//     | #LogarithmWithThreshold(eps) => j`verticalLog($value, $scaleBy, epsilon=$eps) `
//     }

//   let toIntegralSumCacheFn = x =>
//     switch x {
//     | #Multiply => (a, b) => Some(a *. b)
//     | #Divide => (a, b) => Some(a /. b)
//     | #Power | #Logarithm | #LogarithmWithThreshold(_) => (_, _) => None
//     }

//   let toIntegralCacheFn = x =>
//     switch x {
//     | #Multiply => (_, _) => None // TODO: this could probably just be multiplied out (using Continuous.scaleBy)
//     | #Divide => (_, _) => None
//     | #Power => (_, _) => None
//     | #Logarithm => (_, _) => None
//     | #LogarithmWithThreshold(_) => (_, _) => None
//     }
// }
