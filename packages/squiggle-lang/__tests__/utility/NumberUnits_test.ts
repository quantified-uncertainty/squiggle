import { expect } from "@jest/globals";
import { NumberUnits } from "../../src/utility/NumberUnits";

describe("NumberUnits", () => {
  test("typical use cases", () => {
    const unit = NumberUnits.fromFloat(1.23);
    expect(unit.toFloat()).toBe(1.23);
    expect(unit.toString()).toBe("1.23");
  });

  test("boundary values", () => {
    const unit = NumberUnits.fromFloat(Number.MAX_VALUE);
    expect(unit.toFloat()).toBe(Number.MAX_VALUE);
    expect(unit.toString()).toBe(Number.MAX_VALUE.toString());
  });

  test("invalid inputs", () => {
    expect(() => NumberUnits.fromFloat(NaN)).toThrow();
    expect(() => NumberUnits.fromFloat(Infinity)).toThrow();
    expect(() => NumberUnits.fromFloat(-Infinity)).toThrow();
  });
});
