// This is called "frameStack" and not "callStack", because the last frame in errors is often not a function call.
// A "frame" is a pair of a scope (function or top-level scope, currently stored as a string) and a location inside it.
// See this comment to deconfuse about what a frame is: https://github.com/quantified-uncertainty/squiggle/pull/1172#issuecomment-1264115038

import { LocationRange } from "peggy";

export const topFrameName = "<top>";

export class Frame {
  // Weird hack: without this, Frame class won't be a separate type from the plain JS Object type, since it doesn't have any meaningful methods.
  // This could lead to bugs.
  isFrame() {
    return 1;
  }

  constructor(
    public name: string,
    public location?: LocationRange // can be empty for calls from builtin functions, or for the top frame
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

export class FrameStack {
  private frames: Frame[] = [];

  static make(): FrameStack {
    return new FrameStack(); // this top frame is always invisible
  }

  extend(frame: Frame): void {
    this.frames.push(frame);
  }

  pop() {
    this.frames.pop();
  }

  toString(): string {
    return this.toFrameArray()
      .map((f) => f.toString())
      .join("\n");
  }

  toFrameArray(): Frame[] {
    return this.frames;
  }

  getTopFrame(): Frame | undefined {
    return this.frames.at(-1);
  }

  isEmpty(): boolean {
    return !this.frames.length;
  }
}
