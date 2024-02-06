import { LocationRange } from "peggy";

import { FrameStack } from "../reducer/frameStack.js";
import { StackTrace, StackTraceFrame } from "../reducer/stackTrace.js";
import { ErrorMessage, REJavaScriptExn, REOther } from "./messages.js";

// "I" stands for "Internal", since we also have a more public SqError proxy
export class IRuntimeError extends Error {
  // TODO - it would be better to store `m` in `cause`, to like native Error objects do.
  private constructor(
    public m: ErrorMessage,
    public stackTrace: StackTrace
  ) {
    // Should we pass `m.toString()`?
    // It'd be a bit costly and we override `IError.toString()` anyway.
    super();
  }

  // This shouldn't be used much, since frame stack will be empty.
  // But it's useful for global errors, e.g. in SqProject or somethere in the frontend.
  static fromMessage(message: ErrorMessage) {
    return new IRuntimeError(message, new StackTrace(FrameStack.make()));
  }

  static fromMessageWithStackTrace(
    message: ErrorMessage,
    stackTrace: StackTrace
  ): IRuntimeError {
    return new IRuntimeError(message, stackTrace);
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

  static fromExceptionWithStackTrace(
    err: unknown,
    stackTrace: StackTrace
  ): IRuntimeError {
    if (err instanceof IRuntimeError) {
      return err;
    } else if (err instanceof ErrorMessage) {
      // probably comes from FunctionRegistry, adding stacktrace
      return IRuntimeError.fromMessageWithStackTrace(err, stackTrace);
    } else if (err instanceof Error) {
      return IRuntimeError.fromMessageWithStackTrace(
        new REJavaScriptExn(err.message, err.name),
        stackTrace
      );
    } else {
      return IRuntimeError.fromMessageWithStackTrace(
        new REOther("Unknown exception"),
        stackTrace
      );
    }
  }

  override toString() {
    return this.m.toString();
  }

  toStringWithDetails() {
    return (
      this.toString() +
      (this.stackTrace.isEmpty()
        ? ""
        : "\nStack trace:\n" + this.stackTrace.toString())
    );
  }

  getTopFrame(): StackTraceFrame | undefined {
    return this.stackTrace.frames().at(-1);
  }

  getFrameArray(): StackTraceFrame[] {
    return this.stackTrace.frames();
  }
}

// converts raw exceptions into exceptions with stacktrace attached
// already converted exceptions won't be affected
export function rethrowWithStackTrace(
  err: unknown,
  stackTrace: StackTrace
): never {
  throw IRuntimeError.fromExceptionWithStackTrace(err, stackTrace);
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
