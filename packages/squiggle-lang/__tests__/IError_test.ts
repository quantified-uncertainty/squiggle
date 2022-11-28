import * as IError from "../src/reducer/IError";
import * as FrameStack from "../src/reducer/FrameStack";

describe("IError.Message", () => {
  test("toString", () => {
    expect(IError.Message.toString(IError.REOther("test error"))).toBe(
      "Error: test error"
    );
  });
});

describe("IError", () => {
  test("errorFromMessage", () =>
    expect(
      IError.errorToString(
        IError.errorFromMessage(IError.REOther("test error"))
      )
    ).toBe("Error: test error"));

  test("errorToStringWithStackTrace with empty stacktrace", () =>
    expect(
      IError.errorToStringWithStackTrace(
        IError.errorFromMessage(IError.REOther("test error"))
      )
    ).toBe("Error: test error"));

  test("toStringWithStackTrace", () => {
    const frameStack = FrameStack.extend(
      FrameStack.extend(FrameStack.make(), "frame1", undefined),
      "frame2",
      undefined
    );

    expect(
      IError.errorToStringWithStackTrace(
        IError.fromMessageWithFrameStack(
          IError.REOther("test error"),
          frameStack
        )
      )
    ).toBe(`Error: test error
Stack trace:
  frame2
  frame1`);
  });
});
