import { tDate } from "../../src/types/index.js";
import { SDate } from "../../src/utility/SDate.js";
import { vDate } from "../../src/value/index.js";

test("pack/unpack", () => {
  const date = SDate.now();
  const value = vDate(date);
  expect(tDate.unpack(value)).toBe(date);
  expect(tDate.pack(date)).toEqual(value);
});
