import { fnInput, namedInput } from "../../src/library/registry/fnInput.js";
import { tNumber } from "../../src/types/index.js";

describe("fnInput", () => {
  test("named", () => {
    const input = namedInput("TestNumber", tNumber);
    expect(input.toString()).toBe("TestNumber: Number");
  });

  test("named with optional", () => {
    const input = fnInput({
      name: "TestNumber",
      type: tNumber,
      optional: true,
    });
    expect(input.toString()).toBe("TestNumber?: Number");
  });

  test("unnamed", () => {
    const input = fnInput({ type: tNumber });
    expect(input.toString()).toBe("Number");
  });

  test("unnamed with optional", () => {
    const input = fnInput({ type: tNumber, optional: true });
    expect(input.toString()).toBe("Number?");
  });
});
