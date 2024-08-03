import { tDuration } from "../../src/types/index.js";
import { SDuration } from "../../src/utility/SDuration.js";
import { vDuration } from "../../src/value/index.js";

test("pack/unpack", () => {
  const duration = SDuration.fromMs(1234);
  const value = vDuration(duration);
  expect(tDuration.unpack(value)).toBe(duration);
  expect(tDuration.pack(duration)).toEqual(value);
});
