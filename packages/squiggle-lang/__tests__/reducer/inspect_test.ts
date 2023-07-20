import { jest } from "@jest/globals";

import { expectEvalToBe } from "../helpers/reducerHelpers.js";

/*
    You can wrap around any expression with inspect(expr) to log the value of that expression.
    This is useful for debugging. inspect(expr) returns the value of expr, but also prints it out.

    There is a second version of inspect that takes a label, which will print out the label and the value.
*/
describe("Debugging", () => {
  const log = console.log; // save original console.log function
  beforeEach(() => {
    console.log = jest.fn(); // create a new mock function for each test
  });
  afterAll(() => {
    console.log = log; // restore original console.log after all tests
  });

  test("one arg inspect", async () => {
    await expectEvalToBe("inspect(1)", "1");
  });

  test("two args", async () => {
    await expectEvalToBe('inspect(1, "one")', "1");

    const mockedLog = <jest.Mock<typeof console.log>>console.log;

    expect(mockedLog.mock.calls).toHaveLength(1);
    expect(mockedLog.mock.calls[0]).toEqual(["one: 1"]);
  });
});
