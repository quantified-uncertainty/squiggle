import { fnInput, frNamed } from "../../src/library/registry/fnInput.js";
import { frNumber } from "../../src/library/registry/frTypes.js";

describe("fnInput", () => {
  test("named", () => {
    const input = frNamed("TestNumber", frNumber);
    expect(input.toString()).toBe("TestNumber: Number");
  });

  test("named with optional", () => {
    const input = fnInput({
      name: "TestNumber",
      type: frNumber,
      optional: true,
    });
    expect(input.toString()).toBe("TestNumber?: Number");
  });

  test("unnamed", () => {
    const input = fnInput({ type: frNumber });
    expect(input.toString()).toBe("Number");
  });

  test("unnamed with optional", () => {
    const input = fnInput({ type: frNumber, optional: true });
    expect(input.toString()).toBe("Number?");
  });
});
