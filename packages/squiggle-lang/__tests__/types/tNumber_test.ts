import { tNumber } from "../../src/types/index.js";
import { vNumber } from "../../src/value/index.js";

test("pack/unpack", () => {
  const value = vNumber(5);
  expect(tNumber.unpack(value)).toBe(5);
  expect(tNumber.pack(5)).toEqual(value);
});
