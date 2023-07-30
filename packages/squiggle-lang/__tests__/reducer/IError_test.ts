import { IRuntimeError } from "../../src/errors/IError.js";
import { REOther } from "../../src/errors/messages.js";
import { FrameStack } from "../../src/reducer/frameStack.js";

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
    const frameStack = FrameStack.make()
      .extend("frame1", undefined)
      .extend("frame2", undefined);

    expect(
      IRuntimeError.fromMessageWithFrameStack(
        new REOther("test error"),
        frameStack
      ).toStringWithDetails()
    ).toBe(`Error: test error
Stack trace:
  frame2
  frame1`);
  });
});
