import { REOther } from "../src/errors/messages.js";

describe("errors", () => {
  test("REOther", () => {
    const error = new REOther("hello");
    expect(error.toString()).toEqual("Error: hello");
    expect(error.message).toEqual("hello");
  });
});
