import { tDomain } from "../../src/types";
import { vDomain } from "../../src/value";
import { NumericRangeDomain } from "../../src/value/domain";

test("pack/unpack", () => {
  const domain = new NumericRangeDomain(0, 1);
  const value = vDomain(domain);
  expect(tDomain.unpack(value)).toBe(domain);
  expect(tDomain.pack(domain)).toEqual(value);
});
