import { LocationRange } from "../ast/parse.js";
import { JsonValue } from "../utility/typeHelpers.js";
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
  private constructor(
    public frames: StackTraceFrame[],
    public location?: LocationRange // location where the error has happened; not necessarily a function call
  ) {}

  static make(
    frameStack: FrameStack,
    location?: LocationRange // location where the error has happened; not necessarily a function call
  ) {
    const callFrames = frameStack.frames;
    const frames: StackTraceFrame[] = [];

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
        i === callFrames.length ? location : callFrames[i].location;
      frames.push(new StackTraceFrame(name, callLocation));
    }

    return new StackTrace(frames, location);
  }

  toString() {
    // This includes the left offset because it's mostly used in `SqError.toStringWithStackTrace`.
    return this.frames.map((frame) => "  " + frame.toString()).join("\n");
  }

  getTopFrame() {
    return this.frames.at(0);
  }

  getTopLocation() {
    for (const frame of this.frames) {
      if (frame.location) {
        return frame.location;
      }
    }
  }

  isEmpty() {
    return (
      this.frames.length === 0 ||
      (this.frames.length === 1 && !this.frames[0].location)
    );
  }

  serialize(): SerializedStackTrace {
    return {
      frames: this.frames.map((frame) => ({
        name: frame.name,
        location: frame.location ?? null,
      })),
      location: this.location ?? null,
    } satisfies JsonValue;
  }

  static deserialize(data: SerializedStackTrace): StackTrace {
    return new StackTrace(
      data.frames.map(
        (frame) => new StackTraceFrame(frame.name, frame.location ?? undefined)
      ),
      data.location ?? undefined
    );
  }
}

export type SerializedStackTrace = {
  frames: {
    name: string;
    location: LocationRange | null;
  }[];
  location: LocationRange | null;
};
