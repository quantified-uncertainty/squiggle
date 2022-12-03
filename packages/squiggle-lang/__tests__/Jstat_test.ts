import * as fc from "fast-check";
import { testRun } from "./helpers/helpers";

describe("cumulative density function of a normal distribution", () => {
  test("at 3 stdevs to the right of the mean is near 1", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1 }), (mean, stdev) => {
        let threeStdevsAboveMean = mean + 3 * stdev;
        let squiggleString = `cdf(normal(${mean}, ${stdev}), ${threeStdevsAboveMean})`;
        let squiggleResult = testRun(squiggleString);
        expect(squiggleResult.value).toBeCloseTo(1);
      })
    );
  });

  test("at 3 stdevs to the left of the mean is near 0", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1 }), (mean, stdev) => {
        let threeStdevsBelowMean = mean - 3 * stdev;
        let squiggleString = `cdf(normal(${mean}, ${stdev}), ${threeStdevsBelowMean})`;
        let squiggleResult = testRun(squiggleString);
        expect(squiggleResult.value).toBeCloseTo(0);
      })
    );
  });
});
