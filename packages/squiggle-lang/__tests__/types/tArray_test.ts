import { tAny, tArray, tNumber } from "../../src/types/index.js";
import { vArray, vNumber } from "../../src/value/index.js";

describe("unpack", () => {
  const arr = [3, 5, 6];
  const value = vArray(arr.map((i) => vNumber(i)));

  test("unpack number[]", () => {
    expect(tArray(tNumber).unpack(value)).toEqual(arr);
  });

  test("pack number[]", () => {
    expect(tArray(tNumber).pack(arr)).toEqual(value);
  });

  test("unpack any[]", () => {
    expect(tArray(tAny()).unpack(value)).toEqual([
      vNumber(3),
      vNumber(5),
      vNumber(6),
    ]);
  });
});
