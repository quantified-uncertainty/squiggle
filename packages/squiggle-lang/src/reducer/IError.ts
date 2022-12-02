// Messages don't contain any stack trace information.
// FunctionRegistry functions are allowed to throw MessageExceptions, though,

import { object } from "fast-check";
import { ParseError } from "../ast/parse";
import { DistError, distErrorToString } from "../dist/DistError";
import { OperationError, operationErrorToString } from "../OperationError";
import { Frame, FrameStack } from "./FrameStack";

// because they will be caught and rewrapped by Reducer_Lambda code.
export type Message =
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

class MessageException extends Error {
  constructor(public e: Message) {
    super();
  }
  toString() {
    return Message.toString(this.e);
  }
}

export const REOther = (msg: string): Message => ({
  type: "REOther",
  msg,
});

export const RESymbolNotFound = (symbolName: string): Message => ({
  type: "RESymbolNotFound",
  symbolName,
});

export const REDistributionError = (err: DistError): Message => ({
  type: "REDistributionError",
  err,
});

export const REArrayIndexNotFound = (msg: string, index: number): Message => ({
  type: "REArrayIndexNotFound",
  msg,
  index,
});

export const RERecordPropertyNotFound = (
  msg: string,
  index: string
): Message => ({
  type: "RERecordPropertyNotFound",
  msg,
  index,
});

export const REExpectedType = (
  typeName: string,
  valueString: string
): Message => ({
  type: "REExpectedType",
  typeName,
  valueString,
});

export const RENotAFunction = (value: string): Message => ({
  type: "RENotAFunction",
  value,
});

export const REOperationError = (err: OperationError): Message => ({
  type: "REOperationError",
  err,
});

export const REArityError = (
  fn: string | undefined,
  arity: number,
  usedArity: number
): Message => ({
  type: "REArityError",
  fn,
  arity,
  usedArity,
});

export const Message = {
  toString(err: Message): string {
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
        return `Math Error: ${operationErrorToString(err.err)}`;
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
  needToRun(): Message {
    return { type: "RENeedToRun" };
  },

  fromException(exn: unknown): Message {
    if (exn instanceof MessageException) {
      return exn.e;
    } else if (exn instanceof Error) {
      return REOther(exn.message ?? exn.name ?? "Unknown error");
    } else {
      return REOther("Unknown error");
    }
  },

  throw(errorValue: Message): never {
    throw new MessageException(errorValue);
  },
};

export type IError = {
  message: Message;
  frameStack: FrameStack;
};

class IException extends Error {
  constructor(public e: IError) {
    super();
  }
  toString() {
    return errorToString(this.e);
  }
}

export const fromMessageWithFrameStack = (
  message: Message,
  frameStack: FrameStack
): IError => ({
  message,
  frameStack,
});

// this shouldn't be used much, since frame stack will be empty
// but it's useful for global errors, e.g. in ReducerProject or somethere in the frontend
export const errorFromMessage = (message: Message): IError =>
  fromMessageWithFrameStack(message, FrameStack.make());

export const fromParseError = ({ message, location }: ParseError) =>
  fromMessageWithFrameStack(
    { type: "RESyntaxError", desc: message },
    FrameStack.makeSingleFrameStack(location)
  );

export const getTopFrame = (t: IError): Frame | undefined =>
  t.frameStack.getTopFrame();

export const errorToString = (t: IError): string => Message.toString(t.message);

export const createOtherError = (v: string): IError =>
  errorFromMessage(REOther(v));

export const getFrameArray = (t: IError): Frame[] =>
  t.frameStack.toFrameArray();

export const errorToStringWithStackTrace = (t: IError): string =>
  errorToString(t) +
  (t.frameStack.isEmpty() ? "" : "\nStack trace:\n" + t.frameStack.toString());

const sqThrow = (t: IError): never => {
  throw new IException(t);
};

export const throwMessageWithFrameStack = (
  message: Message,
  frameStack: FrameStack
): never => {
  return sqThrow(fromMessageWithFrameStack(message, frameStack));
};

// this shouldn't be used for most runtime errors - the resulting error would have an empty framestack
export const errorFromException = (exn: unknown) => {
  if (exn instanceof IException) {
    return exn.e;
  } else if (exn instanceof MessageException) {
    return errorFromMessage(exn.e);
  } else if (exn instanceof Error) {
    return errorFromMessage({
      type: "REJavaScriptExn",
      msg: exn.message,
      name: object.name,
    });
  } else {
    return errorFromMessage(REOther("Unknown exception"));
  }
};

// converts raw exceptions into exceptions with framestack attached
// already converted exceptions won't be affected
export const rethrowWithFrameStack = <T>(
  fn: () => T,
  frameStack: FrameStack
): T => {
  try {
    return fn();
  } catch (e) {
    if (e instanceof IException) {
      return sqThrow(e.e); // exception already has a framestack
    } else if (e instanceof MessageException) {
      return throwMessageWithFrameStack(e.e, frameStack); // probably comes from FunctionRegistry, adding framestack
    } else if (e instanceof Error) {
      return throwMessageWithFrameStack(
        {
          type: "REJavaScriptExn",
          msg: e.message,
          name: e.name,
        },
        frameStack
      );
    } else {
      return throwMessageWithFrameStack(
        REOther("Unknown exception"),
        frameStack
      );
    }
  }
};
