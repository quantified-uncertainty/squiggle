import { tString } from "../../src/types/index.js";
import { vString } from "../../src/value/index.js";

test("pack/unpack", () => {
  const value = vString("foo");
  expect(tString.unpack(value)).toBe("foo");
  expect(tString.pack("foo")).toEqual(value);
});
