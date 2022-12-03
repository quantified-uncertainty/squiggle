import { vNumber, vString } from "../../src/value";

describe("Value", () => {
  test("toString", () => {
    expect(vNumber(1).toString()).toEqual("1");
    expect(vString("a").toString()).toEqual("'a'");
  });
});
