import { ICompileError, IRuntimeError } from "../errors/IError.js";
import { Frame } from "../reducer/frameStack.js";

abstract class SqAbstractError<T extends string> {
  abstract tag: T;

  abstract toString(): string;
  abstract toStringWithDetails(): string;
}

export class SqFrame {
  constructor(private _value: Frame) {}

  name(): string {
    return this._value.name;
  }

  location() {
    return this._value.location;
  }
}

export class SqRuntimeError extends SqAbstractError<"runtime"> {
  tag = "runtime" as const;

  constructor(private _value: IRuntimeError) {
    super();
  }

  toString() {
    return this._value.toString();
  }

  toStringWithDetails() {
    return this._value.toStringWithDetails();
  }

  private getTopFrame(): SqFrame | undefined {
    const frame = this._value.getTopFrame();
    return frame ? new SqFrame(frame) : undefined;
  }

  getFrameArray(): SqFrame[] {
    const frames = this._value.getFrameArray();
    return frames.map((frame) => new SqFrame(frame));
  }

  location() {
    return this.getTopFrame()?.location();
  }
}

export class SqCompileError extends SqAbstractError<"compile"> {
  tag = "compile" as const;

  constructor(private _value: ICompileError) {
    super();
  }

  toString() {
    return this._value.toString();
  }

  toStringWithDetails() {
    return this._value.toStringWithDetails();
  }

  location() {
    return this._value.location;
  }
}

export class SqOtherError extends SqAbstractError<"other"> {
  tag = "other" as const;

  constructor(private _value: string) {
    super();
  }

  toString() {
    return this._value;
  }

  toStringWithDetails() {
    // no details on other errors
    return this._value;
  }
}

export type SqError = SqRuntimeError | SqCompileError | SqOtherError;
