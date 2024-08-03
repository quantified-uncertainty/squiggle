import { tNumber, tString, tTuple } from "../../src/types";
import { vArray, vNumber, vString } from "../../src/value";

describe("pack/unpack", () => {
  test("two elements", () => {
    const arr = [3, "foo"] as [number, string];
    const value = vArray([vNumber(arr[0]), vString(arr[1])]);
    expect(tTuple(tNumber, tString).unpack(value)).toEqual(arr);
    expect(tTuple(tNumber, tString).pack(arr)).toEqual(value);
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
    expect(tuple.unpack(value)).toEqual(arr);
    expect(tuple.pack(arr)).toEqual(value);
  });
});
