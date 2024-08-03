import { NumericRangeDomain } from "../../src/domains/NumberRangeDomain.js";
import { tDomain } from "../../src/types/index.js";
import { vDomain } from "../../src/value/index.js";

test("pack/unpack", () => {
  const domain = new NumericRangeDomain(0, 1);
  const value = vDomain(domain);
  expect(tDomain.unpack(value)).toBe(domain);
  expect(tDomain.pack(domain)).toEqual(value);
});
