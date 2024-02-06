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
    for (let i = frames.length; i >= 0; i--) {
      const name = i ? frames[i - 1].name : "<top>";
      const location = i === frames.length ? this.location : frames[i].location;
      stackTraceFrames.push(new StackTraceFrame(name, location));
    }

    return stackTraceFrames;
  }

  toString() {
    // this includes the left offset because it's mostly used in SqError.toStringWithStackTrace
    return this.frames()
      .map((frame) => "  " + frame.toString())
      .join("\n");
  }

  isEmpty() {
    return this.frameStack.isEmpty() && !this.location;
  }
}
