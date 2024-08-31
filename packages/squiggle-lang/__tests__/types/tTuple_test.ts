import { tNumber, tString, tTuple } from "../../src/types/index.js";
import { vArray, vNumber, vString } from "../../src/value/index.js";

describe("check", () => {
  test("two elements", () => {
    const arr = [3, "foo"] as [number, string];
    const value = vArray([vNumber(arr[0]), vString(arr[1])]);
    expect(tTuple(tNumber, tString).check(value)).toBe(true);
  });

  test("two elements, wrong order", () => {
    const arr = [3, "foo"] as [number, string];
    const value = vArray([vString(arr[1]), vNumber(arr[0])]);
    expect(tTuple(tNumber, tString).check(value)).toBe(false);
  });

  test("five elements", () => {
    const arr = [3, "foo", 4, 5, 6] as [number, string, number, number, number];
    const value = vArray([
      vNumber(arr[0]),
      vString(arr[1]),
      vNumber(arr[2]),
      vNumber(arr[3]),
      vNumber(arr[4]),
    ]);
    const tuple = tTuple(tNumber, tString, tNumber, tNumber, tNumber);
    expect(tuple.check(value)).toBe(true);
  });
});
