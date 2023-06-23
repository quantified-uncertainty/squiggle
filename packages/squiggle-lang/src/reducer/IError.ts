import { ParseError } from "../ast/parse.js";
import {
  ErrorMessage,
  REJavaScriptExn,
  REOther,
  RESyntaxError,
} from "../errors.js";
import { Frame, FrameStack } from "./frameStack.js";

// "I" stands for "Internal", since we also have a more public SqError proxy
export class IError extends Error {
  // TODO - it would be better to store `m` in `cause`, to like native Error objects do.
  private constructor(public m: ErrorMessage, public frameStack: FrameStack) {
    // Should we pass `m.toString()`?
    // It'd be a bit costly and we override `IError.toString()` anyway.
    super();
  }

  // This shouldn't be used much, since frame stack will be empty.
  // But it's useful for global errors, e.g. in SqProject or somethere in the frontend.
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
      new RESyntaxError(message),
      FrameStack.makeSingleFrameStack(location)
    );
  }

  // This shouldn't be used for most runtime errors - the resulting error would have an empty framestack.
  static fromException(exn: unknown) {
    if (exn instanceof IError) {
      return exn;
    } else if (exn instanceof ErrorMessage) {
      return IError.fromMessage(exn);
    } else if (exn instanceof Error) {
      return IError.fromMessage(new REJavaScriptExn(exn.message, exn.name));
    } else {
      return IError.other("Unknown exception");
    }
  }

  static other(v: string) {
    return IError.fromMessage(new REOther(v));
  }

  toString() {
    return this.m.toString();
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
export function rethrowWithFrameStack(
  err: unknown,
  frameStack: FrameStack
): never {
  if (err instanceof IError) {
    throw err; // exception already has a framestack
  } else if (err instanceof ErrorMessage) {
    throw IError.fromMessageWithFrameStack(err, frameStack); // probably comes from FunctionRegistry, adding framestack
  } else if (err instanceof Error) {
    throw IError.fromMessageWithFrameStack(
      new REJavaScriptExn(err.message, err.name),
      frameStack
    );
  } else {
    throw IError.fromMessageWithFrameStack(
      new REOther("Unknown exception"),
      frameStack
    );
  }
}
