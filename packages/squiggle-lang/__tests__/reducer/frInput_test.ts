import {
  frInput,
  frOptionalInput,
  namedInput,
} from "../../src/library/FrInput.js";
import { frNumber } from "../../src/library/FrType.js";

describe("fnInput", () => {
  test("named", () => {
    const input = namedInput("TestNumber", frNumber);
    expect(input.toString()).toBe("TestNumber: Number");
  });

  test("named with optional", () => {
    const input = frOptionalInput({
      name: "TestNumber",
      type: frNumber,
    });
    expect(input.toString()).toBe("TestNumber?: Number");
  });

  test("unnamed", () => {
    const input = frInput({ type: frNumber });
    expect(input.toString()).toBe("Number");
  });

  test("unnamed with optional", () => {
    const input = frOptionalInput({ type: frNumber });
    expect(input.toString()).toBe("Number?");
  });
});
