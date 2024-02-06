import { LocationRange } from "peggy";

import { FrameStack } from "./frameStack.js";

export class StackTraceFrame {
  constructor(
    public name: string,
    public location?: LocationRange
  ) {}

  toString() {
    return (
      this.name +
      (this.location
        ? ` at line ${this.location.start.line}, column ${this.location.start.column}, file ${this.location.source}`
        : "")
    );
  }
}

export class StackTrace {
  constructor(
    public frameStack: FrameStack,
    public location?: LocationRange
  ) {}

  frames() {
    const frames = this.frameStack.toFrameArray();

    const stackTraceFrames = [];
    /**
     * Stack trace frames are shifted diagonally by one compared to the call stack frames.
     * For example, if we had these call stack frames:
     * - f() was called from location 1 (on top level)
     * - g() was called from location 2 (inside f())
     *
     * Then in the stack trace, it's going to be:
     * - g() at location 3
     * - f() at location 2
     * - <top> at location 1
     */
    for (let i = frames.length; i >= 0; i--) {
      const name = i ? frames[i - 1].name : "<top>";
      const location = i === frames.length ? this.location : frames[i].location;
      stackTraceFrames.push(new StackTraceFrame(name, location));
    }

    return stackTraceFrames;
  }

  toString() {
    // This includes the left offset because it's mostly used in `SqError.toStringWithStackTrace`.
    return this.frames()
      .map((frame) => "  " + frame.toString())
      .join("\n");
  }

  isEmpty() {
    return this.frameStack.isEmpty() && !this.location;
  }
}
