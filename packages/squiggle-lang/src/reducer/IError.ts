import { ParseError } from "../ast/parse";
import { ErrorMessage, MessageException, REOther } from "./ErrorMessage";
import { Frame, FrameStack } from "./frameStack";

// "I" stands for "Internal", since we also have a more public SqError proxy
export class IError extends Error {
  private constructor(public m: ErrorMessage, public frameStack: FrameStack) {
    super(); // pass `m.toString()`? a bit costly and we override `IError.toString() anyway`
  }

  // this shouldn't be used much, since frame stack will be empty
  // but it's useful for global errors, e.g. in ReducerProject or somethere in the frontend
  static fromMessage(message: ErrorMessage) {
    return new IError(message, FrameStack.make());
  }

  static fromMessageWithFrameStack(
    message: ErrorMessage,
    frameStack: FrameStack
  ): IError {
    return new IError(message, frameStack);
  }

  static fromParseError({ message, location }: ParseError) {
    return IError.fromMessageWithFrameStack(
      { type: "RESyntaxError", desc: message },
      FrameStack.makeSingleFrameStack(location)
    );
  }

  // this shouldn't be used for most runtime errors - the resulting error would have an empty framestack
  static fromException(exn: unknown) {
    if (exn instanceof IError) {
      return exn;
    } else if (exn instanceof MessageException) {
      return IError.fromMessage(exn.e);
    } else if (exn instanceof Error) {
      return IError.fromMessage({
        type: "REJavaScriptExn",
        msg: exn.message,
        name: exn.name,
      });
    } else {
      return IError.other("Unknown exception");
    }
  }

  static other(v: string) {
    return IError.fromMessage(REOther(v));
  }

  toString() {
    return ErrorMessage.toString(this.m);
  }

  toStringWithStackTrace() {
    return (
      this.toString() +
      (this.frameStack.isEmpty()
        ? ""
        : "\nStack trace:\n" + this.frameStack.toString())
    );
  }

  getTopFrame(): Frame | undefined {
    return this.frameStack.getTopFrame();
  }

  getFrameArray(): Frame[] {
    return this.frameStack.toFrameArray();
  }
}

// converts raw exceptions into exceptions with framestack attached
// already converted exceptions won't be affected
export const rethrowWithFrameStack = <T>(
  fn: () => T,
  frameStack: FrameStack
): T => {
  try {
    return fn();
  } catch (e) {
    if (e instanceof IError) {
      throw e; // exception already has a framestack
    } else if (e instanceof MessageException) {
      throw IError.fromMessageWithFrameStack(e.e, frameStack); // probably comes from FunctionRegistry, adding framestack
    } else if (e instanceof Error) {
      throw IError.fromMessageWithFrameStack(
        {
          type: "REJavaScriptExn",
          msg: e.message,
          name: e.name,
        },
        frameStack
      );
    } else {
      throw IError.fromMessageWithFrameStack(
        REOther("Unknown exception"),
        frameStack
      );
    }
  }
};
