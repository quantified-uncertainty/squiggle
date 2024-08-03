import { tBool } from "../../src/types/index.js";
import { vBool } from "../../src/value/index.js";

test("pack/unpack", () => {
  const value = vBool(true);
  expect(tBool.unpack(value)).toBe(true);
  expect(tBool.pack(true)).toEqual(value);
});
