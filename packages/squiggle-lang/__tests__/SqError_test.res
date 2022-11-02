open Jest
open Expect

describe("SqError.Message", () => {
  test("toString", () =>
    expect(SqError.Message.REOther("test error")->SqError.Message.toString)->toBe(
      "Error: test error",
    )
  )
})

describe("SqError", () => {
  test("fromMessage", () =>
    expect(SqError.Message.REOther("test error")->SqError.fromMessage->SqError.toString)->toBe(
      "Error: test error",
    )
  )

  test("toStringWithStackTrace with empty stacktrace", () =>
    expect(
      SqError.Message.REOther("test error")->SqError.fromMessage->SqError.toStringWithStackTrace,
    )->toBe("Error: test error")
  )

  test("toStringWithStackTrace", () => {
    let frameStack =
      Reducer_FrameStack.make()
      ->Reducer_FrameStack.extend("frame1", None)
      ->Reducer_FrameStack.extend("frame2", None)

    expect(
      SqError.Message.REOther("test error")
      ->SqError.fromMessageWithFrameStack(frameStack)
      ->SqError.toStringWithStackTrace,
    )->toBe(`Error: test error
Stack trace:
  frame2
  frame1`)
  })
})
