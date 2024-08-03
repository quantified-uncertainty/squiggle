import { Normal } from "../../src/dists/SymbolicDist/Normal.js";
import { tDistOrNumber } from "../../src/types/index.js";
import { vDist, vNumber } from "../../src/value/index.js";

describe("pack/unpack", () => {
  test("number", () => {
    const number = 123;
    const value = vNumber(number);
    expect(tDistOrNumber.unpack(value)).toBe(number);
    expect(tDistOrNumber.pack(number)).toEqual(value);
  });

  test("dist", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(tDistOrNumber.unpack(value)).toBe(dist);
    expect(tDistOrNumber.pack(dist)).toEqual(value);
  });
});
