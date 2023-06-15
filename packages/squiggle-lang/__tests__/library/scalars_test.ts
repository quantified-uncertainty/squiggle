import { testRun } from "../helpers/helpers.js";
import * as fc from "fast-check";

describe("Scalar manipulation is well-modeled by javascript math", () => {
  test("in the case of natural logarithms", () => {
    fc.assert(
      fc.asyncProperty(fc.nat(), async (x) => {
        const squiggleString = `log(${x})`;
        const squiggleResult = await testRun(squiggleString);
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
      fc.asyncProperty(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        async (x, y, z) => {
          const squiggleString = `x = ${x}; y = ${y}; z = ${z}; x + y + z`;
          const squiggleResult = await testRun(squiggleString);
          expect(squiggleResult.value).toBeCloseTo(x + y + z);
        }
      )
    );
  });
});
