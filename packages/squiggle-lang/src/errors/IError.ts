import { LocationRange } from "peggy";

import { StackTrace, StackTraceFrame } from "../reducer/StackTrace.js";
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

  static fromMessage(
    message: ErrorMessage,
    stackTrace: StackTrace
  ): IRuntimeError {
    return new IRuntimeError(message, stackTrace);
  }

  static fromException(err: unknown, stackTrace: StackTrace): IRuntimeError {
    if (err instanceof IRuntimeError) {
      return err;
    } else if (err instanceof ErrorMessage) {
      // probably comes from FunctionRegistry, adding stacktrace
      return IRuntimeError.fromMessage(err, stackTrace);
    } else if (err instanceof Error) {
      return IRuntimeError.fromMessage(
        new REJavaScriptExn(err.message, err.name),
        stackTrace
      );
    } else {
      return IRuntimeError.fromMessage(
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
    return this.stackTrace.frames.at(-1);
  }

  getFrameArray(): StackTraceFrame[] {
    return this.stackTrace.frames;
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
