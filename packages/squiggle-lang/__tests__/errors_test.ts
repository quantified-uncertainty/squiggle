import { ErrorMessage } from "../src/errors/messages.js";
import { run } from "../src/run.js";

describe("errors", () => {
  test("otherError", () => {
    const error = ErrorMessage.otherError("hello");
    expect(error.toString()).toEqual("Error: hello");
    expect(error.message).toEqual("Error: hello");
  });
});

describe("SqError.location", () => {
  test("returns undefined for empty stack traces", async () => {
    const result = await run(`a = []
f() = a[0]

x = f()
`);
    expect(result.result.ok).toBe(false);
    if (result.result.ok) {
      throw new Error("Expected code to fail");
    }
    const error = result.result.value.errors[0];
    if (error.tag !== "runtime") {
      throw new Error("Expected error to be a runtime error");
    }
    expect(error.location()?.start).toMatchObject({ line: 2, column: 7 });
  });
});
