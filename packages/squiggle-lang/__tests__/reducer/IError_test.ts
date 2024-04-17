import { IRuntimeError } from "../../src/errors/IError.js";
import { REOther } from "../../src/errors/messages.js";
import { getStdLib } from "../../src/library/index.js";
import { Frame, FrameStack } from "../../src/reducer/FrameStack.js";
import { StackTrace } from "../../src/reducer/StackTrace.js";

describe("ErrorMessage", () => {
  test("toString", () => {
    expect(new REOther("test error").toString()).toBe("Error: test error");
  });
});

describe("IError", () => {
  test("toString", () =>
    expect(
      IRuntimeError.fromMessage(
        new REOther("test error"),
        StackTrace.make(FrameStack.make())
      ).toString()
    ).toBe("Error: test error"));

  test("toStringWithStacktrace with empty stacktrace", () =>
    expect(
      IRuntimeError.fromMessage(
        new REOther("test error"),
        StackTrace.make(FrameStack.make())
      ).toStringWithDetails()
    ).toBe("Error: test error"));

  test("toStringWithStackTrace", () => {
    const stdlib = getStdLib();

    const [lambda1, lambda2] = ["add", "normal"].map((name) => {
      const value = stdlib.get(name);
      if (!value || value.type !== "Lambda") {
        throw new Error("Expected a lambda");
      }
      return value.value;
    });

    const frameStack = FrameStack.make();
    frameStack.extend(new Frame(lambda1, undefined));
    frameStack.extend(
      new Frame(lambda2, {
        source: "test",
        start: { line: 3, column: 4, offset: 5 },
        end: { line: 3, column: 5, offset: 6 },
      })
    );

    expect(
      IRuntimeError.fromMessage(
        new REOther("test error"),
        StackTrace.make(frameStack)
      ).toStringWithDetails()
    ).toBe(`Error: test error
Stack trace:
  normal
  add at line 3, column 4, file test
  <top>`);
  });
});
