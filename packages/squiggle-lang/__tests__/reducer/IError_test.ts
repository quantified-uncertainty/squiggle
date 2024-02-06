import { IRuntimeError } from "../../src/errors/IError.js";
import { REOther } from "../../src/errors/messages.js";
import { Frame, FrameStack } from "../../src/reducer/frameStack.js";
import { StackTrace } from "../../src/reducer/stackTrace.js";

describe("ErrorMessage", () => {
  test("toString", () => {
    expect(new REOther("test error").toString()).toBe("Error: test error");
  });
});

describe("IError", () => {
  test("toString", () =>
    expect(
      IRuntimeError.fromMessage(new REOther("test error")).toString()
    ).toBe("Error: test error"));

  test("toStringWithStacktrace with empty stacktrace", () =>
    expect(
      IRuntimeError.fromMessage(new REOther("test error")).toStringWithDetails()
    ).toBe("Error: test error"));

  test("toStringWithStackTrace", () => {
    const frameStack = FrameStack.make();
    frameStack.extend(new Frame("frame1", undefined));
    frameStack.extend(new Frame("frame2", undefined));

    expect(
      IRuntimeError.fromMessageWithStackTrace(
        new REOther("test error"),
        new StackTrace(frameStack)
      ).toStringWithDetails()
    ).toBe(`Error: test error
Stack trace:
  frame2
  frame1`);
  });
});
