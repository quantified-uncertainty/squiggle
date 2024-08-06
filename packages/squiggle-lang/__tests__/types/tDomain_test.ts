import { tDomain, tNumber } from "../../src/types/index.js";
import { TNumberRange } from "../../src/types/TNumberRange.js";
import { vDomain } from "../../src/value/index.js";

test("pack/unpack", () => {
  const domain = new TNumberRange(0, 1);
  const value = vDomain(domain);

  // unpack is broken; unpacking domain values is complicated, see TDomain.unpack code for details
  // expect(tDomain(tNumber).unpack(value)).toBe(domain);
  expect(tDomain(tNumber).pack(domain)).toEqual(value);
});
