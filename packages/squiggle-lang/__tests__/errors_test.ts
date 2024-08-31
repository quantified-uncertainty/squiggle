import { ErrorMessage } from "../src/errors/messages.js";

describe("errors", () => {
  test("otherError", () => {
    const error = ErrorMessage.otherError("hello");
    expect(error.toString()).toEqual("Error: hello");
    expect(error.message).toEqual("Error: hello");
  });
});
