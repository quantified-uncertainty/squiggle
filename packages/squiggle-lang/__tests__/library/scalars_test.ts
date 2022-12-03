import { testRun } from "../helpers/helpers";
import * as fc from "fast-check";

describe("Scalar manipulation is well-modeled by javascript math", () => {
  test("in the case of natural logarithms", () => {
    fc.assert(
      fc.property(fc.nat(), (x) => {
        const squiggleString = `log(${x})`;
        const squiggleResult = testRun(squiggleString);
        if (x === 0) {
          expect(squiggleResult.value).toEqual(-Infinity);
        } else {
          expect(squiggleResult.value).toEqual(Math.log(x));
        }
      })
    );
  });

  test("in the case of addition (with assignment)", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (x, y, z) => {
        let squiggleString = `x = ${x}; y = ${y}; z = ${z}; x + y + z`;
        let squiggleResult = testRun(squiggleString);
        expect(squiggleResult.value).toBeCloseTo(x + y + z);
      })
    );
  });
});
