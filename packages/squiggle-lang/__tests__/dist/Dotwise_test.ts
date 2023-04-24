import * as fc from "fast-check";

import { binaryOperations } from "../../src/dist/distOperations/index.js";
import { DivisionByZeroError } from "../../src/operationError.js";
import {
  env,
  mkExponential,
  mkNormal,
  unpackResult,
} from "../helpers/distHelpers.js";

describe("dotSubtract", () => {
  test("mean of normal minus exponential (unit)", () => {
    const mean = 0;
    const rate = 10;
    const dotDifference = unpackResult(
      binaryOperations.pointwiseSubtract(
        mkNormal(mean, 1.0),
        mkExponential(rate),
        { env }
      )
    );
    const meanValue = dotDifference.mean();
    const meanAnalytical = mean - mkExponential(rate).mean();
    expect(meanValue).toBeCloseTo(meanAnalytical);
  });
  /*
    It seems like this test should work, and it's plausible that
    there's some bug in `pointwiseSubtract`
 */
  test.skip("mean of normal minus exponential (property)", () => {
    fc.assert(
      fc.property(
        fc.float(),
        fc.float({ min: new Float32Array([1e-5])[0], max: 1e5 }),
        (mean, rate) => {
          // We limit ourselves to stdev=1 so that the integral is trivial
          const dotDifferenceR = binaryOperations.pointwiseSubtract(
            mkNormal(mean, 1.0),
            mkExponential(rate),
            { env }
          );
          if (!dotDifferenceR.ok) {
            const err = dotDifferenceR.value;
            return (
              err.type === "OperationError" &&
              err.value instanceof DivisionByZeroError
            );
          }

          const dotDifference = dotDifferenceR.value;

          const meanValue = dotDifference.mean();
          // according to algebra or random variables,
          const meanAnalytical = mean - mkExponential(rate).mean();
          console.log(meanValue, meanAnalytical);
          return (
            Math.abs(meanValue - meanAnalytical) / Math.abs(meanValue) < 1e-2
          ); // 1% relative error
        }
      )
    );
  });
});
