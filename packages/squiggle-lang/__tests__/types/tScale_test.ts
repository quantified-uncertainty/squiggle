import { tScale } from "../../src/types/index.js";
import { Scale, vScale } from "../../src/value/VScale.js";

test("pack/unpack", () => {
  const scale: Scale = { method: { type: "linear" } };
  const value = vScale(scale);
  expect(tScale.unpack(value)).toBe(scale);
  expect(tScale.pack(scale)).toEqual(value);
});
