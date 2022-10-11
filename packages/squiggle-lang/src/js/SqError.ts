import * as RSError from "../rescript/SqError.gen";
import * as RSReducerT from "../rescript/Reducer/Reducer_T.gen";

import * as RSFrameStack from "../rescript/Reducer/Reducer_FrameStack.gen";

export { location as SqLocation } from "../rescript/Reducer/Reducer_Peggy/Reducer_Peggy_Parse.gen";

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

  getTopFrame(): SqFrame | undefined {
    const frame = RSFrameStack.getTopFrame(RSError.getFrameStack(this._value));
    return frame ? new SqFrame(frame) : undefined;
  }

  getFrameArray(): SqFrame[] {
    const frames = RSError.getFrameArray(this._value);
    return frames.map((frame) => new SqFrame(frame));
  }

  location() {
    return this.getTopFrame()?.location();
  }
}

export class SqFrame {
  constructor(private _value: RSReducerT.frame) {}

  name(): string {
    return RSFrameStack.Frame.getName(this._value);
  }

  location() {
    return RSFrameStack.Frame.getLocation(this._value);
  }
}
