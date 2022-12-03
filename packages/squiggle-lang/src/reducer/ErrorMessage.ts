import { DistError, distErrorToString } from "../dist/DistError";
import { OperationError } from "../operationError";

// This code is written in old data-oriented style.
// It probably should be rewritten with classes, to match the coding style in the rest of the codebase.

// Messages don't contain any stack trace information.
// FunctionRegistry functions are allowed to throw MessageExceptions, though,
// because they will be caught and rewrapped by Reducer_Lambda code.
export type ErrorMessage =
  | {
      type: "REArityError";
      fn?: string;
      arity: number;
      usedArity: number;
    }
  | {
      type: "REArrayIndexNotFound";
      msg: string;
      index: number;
    }
  | {
      type: "REAssignmentExpected";
    }
  | {
      type: "REDistributionError";
      err: DistError;
    }
  | {
      type: "REExpectedType";
      typeName: string;
      valueString: string;
    }
  | {
      type: "REExpressionExpected";
    }
  | {
      type: "REFunctionExpected";
      msg: string;
    }
  | {
      type: "REFunctionNotFound";
      msg: string;
    }
  | {
      type: "REJavaScriptExn";
      msg?: string;
      name?: string; // Javascript Exception
    }
  | {
      type: "RENotAFunction";
      value: string;
    }
  | {
      type: "REOperationError";
      err: OperationError;
    }
  | {
      type: "RERecordPropertyNotFound";
      msg: string;
      index: string;
    }
  | {
      type: "RESymbolNotFound";
      symbolName: string;
    }
  | {
      type: "RESyntaxError";
      desc: string;
    }
  | {
      type: "RETodo";
      msg: string;
    }
  | {
      type: "RENeedToRun";
    }
  | {
      type: "REOther";
      msg: string;
    };

export class MessageException extends Error {
  constructor(public e: ErrorMessage) {
    super();
  }
  toString() {
    return ErrorMessage.toString(this.e);
  }
}

export const REOther = (msg: string): ErrorMessage => ({
  type: "REOther",
  msg,
});

export const RESymbolNotFound = (symbolName: string): ErrorMessage => ({
  type: "RESymbolNotFound",
  symbolName,
});

export const REDistributionError = (err: DistError): ErrorMessage => ({
  type: "REDistributionError",
  err,
});

export const REArrayIndexNotFound = (
  msg: string,
  index: number
): ErrorMessage => ({
  type: "REArrayIndexNotFound",
  msg,
  index,
});

export const RERecordPropertyNotFound = (
  msg: string,
  index: string
): ErrorMessage => ({
  type: "RERecordPropertyNotFound",
  msg,
  index,
});

export const REExpectedType = (
  typeName: string,
  valueString: string
): ErrorMessage => ({
  type: "REExpectedType",
  typeName,
  valueString,
});

export const RENotAFunction = (value: string): ErrorMessage => ({
  type: "RENotAFunction",
  value,
});

export const REOperationError = (err: OperationError): ErrorMessage => ({
  type: "REOperationError",
  err,
});

export const REArityError = (
  fn: string | undefined,
  arity: number,
  usedArity: number
): ErrorMessage => ({
  type: "REArityError",
  fn,
  arity,
  usedArity,
});

export const ErrorMessage = {
  toString(err: ErrorMessage): string {
    switch (err.type) {
      case "REArityError":
        return `${err.arity} arguments expected. Instead ${err.usedArity} argument(s) were passed.`;
      case "REArrayIndexNotFound":
        return `${err.msg}: ${err.index}`;

      case "REAssignmentExpected":
        return "Assignment expected";
      case "REExpressionExpected":
        return "Expression expected";
      case "REFunctionExpected":
        return `Function expected: ${err.msg}`;
      case "REFunctionNotFound":
        return `Function not found: ${err.msg}`;
      case "REDistributionError":
        return `Distribution Math Error: ${distErrorToString(err.err)}`;
      case "REOperationError":
        return `Math Error: ${err.err.toString()}`;
      case "REJavaScriptExn": {
        let answer = "JS Exception:";
        if (err.name !== undefined) answer += ` ${err.name}:`;
        if (err.msg !== undefined) answer += ` ${err.msg}`;
        return answer;
      }
      case "RENotAFunction":
        return `${err.value} is not a function`;
      case "RERecordPropertyNotFound":
        return `${err.msg}: ${err.index}`;
      case "RESymbolNotFound":
        return `${err.symbolName} is not defined`;
      case "RESyntaxError":
        return `Syntax Error: ${err.desc}`;
      case "RETodo":
        return `TODO: ${err.msg}`;
      case "REExpectedType":
        return `Expected type: ${err.typeName} but got: ${err.valueString}`;
      case "RENeedToRun":
        return "Need to run";
      case "REOther":
        return `Error: ${err.msg}`;
      default:
        return `Unknown error ${err}`;
    }
  },
  needToRun(): ErrorMessage {
    return { type: "RENeedToRun" };
  },

  fromException(exn: unknown): ErrorMessage {
    if (exn instanceof MessageException) {
      return exn.e;
    } else if (exn instanceof Error) {
      return REOther(exn.message ?? exn.name ?? "Unknown error");
    } else {
      return REOther("Unknown error");
    }
  },

  throw(errorValue: ErrorMessage): never {
    throw new MessageException(errorValue);
  },
};
