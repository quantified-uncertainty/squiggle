import { tDomain } from "../../src/types/index.js";
import { NumericRangeDomain } from "../../src/value/domain.js";
import { vDomain } from "../../src/value/index.js";

test("pack/unpack", () => {
  const domain = new NumericRangeDomain(0, 1);
  const value = vDomain(domain);
  expect(tDomain.unpack(value)).toBe(domain);
  expect(tDomain.pack(domain)).toEqual(value);
});
