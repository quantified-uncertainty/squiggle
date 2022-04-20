import { errorValueToString } from "../../src/js/index";
import * as fc from "fast-check";
import { testRun } from "./TestHelpers";

describe("Jstat: cumulative density function", () => {
  test("of a normal distribution at 3 stdevs to the right of the mean is within epsilon of 1", () => {
    fc.assert(
      fc.property(fc.float(), fc.float({ min: 1e-7 }), (mean, stdev) => {
        let squiggleString = `cdf(normal(${mean}, ${stdev}), ${
          mean + 3 * stdev
        })`;
        let squiggleResult = testRun(squiggleString);
        let epsilon = 5e-3;
        switch (squiggleResult.tag) {
          case "Error":
            expect(errorValueToString(squiggleResult.value)).toEqual(
              "<Test cases don't seem to be finding this>"
            );
          case "Ok":
            expect(squiggleResult.value.value).toBeGreaterThan(1 - epsilon);
        }
      })
    );
  });

  test("of a normal distribution at 3 stdevs to the left of the mean is within epsilon of 0", () => {
    fc.assert(
      fc.property(fc.float(), fc.float({ min: 1e-7 }), (mean, stdev) => {
        let squiggleString = `cdf(normal(${mean}, ${stdev}), ${
          mean - 3 * stdev
        })`;
        let squiggleResult = testRun(squiggleString);
        let epsilon = 5e-3;
        switch (squiggleResult.tag) {
          case "Error":
            expect(errorValueToString(squiggleResult.value)).toEqual(
              "<Test cases don't seem to be finding this>"
            );
          case "Ok":
            expect(squiggleResult.value.value).toBeLessThan(epsilon);
        }
      })
    );
  });
});
