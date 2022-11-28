import { valueToString, vNumber, vString } from "../../src/value";

describe("Value", () => {
  test("toString", () => {
    expect(valueToString(vNumber(1))).toEqual("1");
    expect(valueToString(vString("a"))).toEqual("'a'");
  });
});
