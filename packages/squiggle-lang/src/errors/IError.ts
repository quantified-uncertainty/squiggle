import { LocationRange } from "peggy";
import { Frame, FrameStack } from "../reducer/frameStack.js";
import { ErrorMessage, REJavaScriptExn, REOther } from "./messages.js";

// "I" stands for "Internal", since we also have a more public SqError proxy
export class IRuntimeError extends Error {
  // TODO - it would be better to store `m` in `cause`, to like native Error objects do.
  private constructor(
    public m: ErrorMessage,
    public frameStack: FrameStack
  ) {
    // Should we pass `m.toString()`?
    // It'd be a bit costly and we override `IError.toString()` anyway.
    super();
  }

  // This shouldn't be used much, since frame stack will be empty.
  // But it's useful for global errors, e.g. in SqProject or somethere in the frontend.
  static fromMessage(message: ErrorMessage) {
    return new IRuntimeError(message, FrameStack.make());
  }

  static fromMessageWithFrameStack(
    message: ErrorMessage,
    frameStack: FrameStack
  ): IRuntimeError {
    return new IRuntimeError(message, frameStack);
  }

  // This shouldn't be used for most runtime errors - the resulting error would have an empty framestack.
  static fromException(exn: unknown) {
    if (exn instanceof IRuntimeError) {
      return exn;
    } else if (exn instanceof ErrorMessage) {
      return IRuntimeError.fromMessage(exn);
    } else if (exn instanceof Error) {
      return IRuntimeError.fromMessage(
        new REJavaScriptExn(exn.message, exn.name)
      );
    } else {
      return IRuntimeError.fromMessage(new REOther("Unknown exception"));
    }
  }

  override toString() {
    return this.m.toString();
  }

  toStringWithDetails() {
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
  if (err instanceof IRuntimeError) {
    throw err; // exception already has a framestack
  } else if (err instanceof ErrorMessage) {
    throw IRuntimeError.fromMessageWithFrameStack(err, frameStack); // probably comes from FunctionRegistry, adding framestack
  } else if (err instanceof Error) {
    throw IRuntimeError.fromMessageWithFrameStack(
      new REJavaScriptExn(err.message, err.name),
      frameStack
    );
  } else {
    throw IRuntimeError.fromMessageWithFrameStack(
      new REOther("Unknown exception"),
      frameStack
    );
  }
}

export class ICompileError extends Error {
  constructor(
    public override message: string,
    public location: LocationRange
  ) {
    super();
  }

  override toString() {
    return this.message;
  }

  toStringWithDetails() {
    return (
      this.toString() +
      "\nLocation:\n  " +
      `at line ${this.location.start.line}, column ${this.location.start.column}, file ${this.location.source}`
    );
  }
}
