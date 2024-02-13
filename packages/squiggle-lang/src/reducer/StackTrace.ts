import { LocationRange } from "peggy";

import { FrameStack } from "./FrameStack.js";

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
  frames: StackTraceFrame[];
  location?: LocationRange;

  constructor(
    frameStack: FrameStack,
    location?: LocationRange // location where the error has happened; not necessarily a function call
  ) {
    this.location = location;

    const callFrames = frameStack.frames;
    this.frames = [];

    /**
     * Stack trace frames are shifted diagonally by one compared to the call stack frames.
     * For example, if we had these call stack frames:
     * - g(), called from location 2 (inside f())
     * - f(), called from location 1 (on top level)
     *
     * Then in the stack trace, it's going to be:
     * - g() at location 3
     * - f() at location 2
     * - <top> at location 1
     */
    for (let i = callFrames.length; i >= 0; i--) {
      const name = i ? callFrames[i - 1].lambda.display() : "<top>";
      const callLocation =
        i === callFrames.length ? this.location : callFrames[i].location;
      this.frames.push(new StackTraceFrame(name, callLocation));
    }
  }

  toString() {
    // This includes the left offset because it's mostly used in `SqError.toStringWithStackTrace`.
    return this.frames.map((frame) => "  " + frame.toString()).join("\n");
  }

  isEmpty() {
    return (
      this.frames.length === 0 ||
      (this.frames.length === 1 && !this.frames[0].location)
    );
  }
}
