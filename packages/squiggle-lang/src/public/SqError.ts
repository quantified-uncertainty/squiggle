import {
  createOtherError,
  errorToString,
  errorToStringWithStackTrace,
  getFrameArray,
  getTopFrame,
  IError,
} from "../reducer/IError";
import { Frame } from "../reducer/FrameStack";

export class SqError {
  constructor(private _value: IError) {}

  toString() {
    return errorToString(this._value);
  }

  toStringWithStackTrace() {
    return errorToStringWithStackTrace(this._value);
  }

  static createOtherError(v: string) {
    return new SqError(createOtherError(v));
  }

  getTopFrame(): SqFrame | undefined {
    const frame = getTopFrame(this._value);
    return frame ? new SqFrame(frame) : undefined;
  }

  getFrameArray(): SqFrame[] {
    const frames = getFrameArray(this._value);
    return frames.map((frame) => new SqFrame(frame));
  }

  location() {
    return this.getTopFrame()?.location();
  }
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
