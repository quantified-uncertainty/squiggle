import { IError } from "../reducer/IError";
import { Frame } from "../reducer/frameStack";

export class SqError {
  constructor(private _value: IError) {}

  toString() {
    return this._value.toString();
  }

  toStringWithStackTrace() {
    return this._value.toStringWithStackTrace();
  }

  static createOtherError(v: string) {
    return new SqError(IError.other(v));
  }

  getTopFrame(): SqFrame | undefined {
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

export class SqFrame {
  constructor(private _value: Frame) {}

  name(): string {
    return this._value.name;
  }

  location() {
    return this._value.location;
  }
}
