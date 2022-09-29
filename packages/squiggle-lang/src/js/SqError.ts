import * as RSError from "../rescript/SqError.gen";

import * as RSCallStack from "../rescript/Reducer/Reducer_CallStack.gen";

export type SqFrame = RSCallStack.frame;

export class SqError {
  constructor(private _value: RSError.t) {}

  toString() {
    return RSError.toString(this._value);
  }

  toStringWithStackTrace() {
    return RSError.toStringWithStackTrace(this._value);
  }

  static createOtherError(v: string) {
    return new SqError(RSError.createOtherError(v));
  }

  getTopFrame(): SqCallFrame | undefined {
    const frame = RSCallStack.getTopFrame(RSError.getStackTrace(this._value));
    return frame ? new SqCallFrame(frame) : undefined;
  }

  getFrameArray(): SqCallFrame[] {
    const frames = RSError.getFrameArray(this._value);
    return frames.map((frame) => new SqCallFrame(frame));
  }
}

export class SqCallFrame {
  constructor(private _value: SqFrame) {}
}
