import * as fc from "fast-check";
import { testRun } from "./helpers/helpers.js";

describe("cumulative density function of a normal distribution", () => {
  test("at 3 stdevs to the right of the mean is near 1", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer(),
        fc.integer({ min: 1 }),
        async (mean, stdev) => {
          const threeStdevsAboveMean = mean + 3 * stdev;
          const squiggleString = `cdf(Sym.normal(${mean}, ${stdev}), ${threeStdevsAboveMean})`;
          const squiggleResult = await testRun(squiggleString);
          expect(squiggleResult.value).toBeCloseTo(1);
        }
      )
    );
  });

  test("at 3 stdevs to the left of the mean is near 0", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer(),
        fc.integer({ min: 1 }),
        async (mean, stdev) => {
          const threeStdevsBelowMean = mean - 3 * stdev;
          const squiggleString = `cdf(Sym.normal(${mean}, ${stdev}), ${threeStdevsBelowMean})`;
          const squiggleResult = await testRun(squiggleString);
          expect(squiggleResult.value).toBeCloseTo(0);
        }
      )
    );
  });
});
