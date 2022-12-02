import { IError } from "../../src/reducer/IError";
import { FrameStack } from "../../src/reducer/frameStack";
import { ErrorMessage, REOther } from "../../src/reducer/ErrorMessage";

describe("ErrorMessage", () => {
  test("toString", () => {
    expect(ErrorMessage.toString(REOther("test error"))).toBe(
      "Error: test error"
    );
  });
});

describe("IError", () => {
  test("toString", () =>
    expect(IError.other("test error").toString()).toBe("Error: test error"));

  test("toStringWithStacktrace with empty stacktrace", () =>
    expect(IError.other("test error").toStringWithStackTrace()).toBe(
      "Error: test error"
    ));

  test("toStringWithStackTrace", () => {
    const frameStack = FrameStack.make()
      .extend("frame1", undefined)
      .extend("frame2", undefined);

    expect(
      IError.fromMessageWithFrameStack(
        REOther("test error"),
        frameStack
      ).toStringWithStackTrace()
    ).toBe(`Error: test error
Stack trace:
  frame2
  frame1`);
  });
});
