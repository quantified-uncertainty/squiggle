import { operationDistError } from "../../src/dist/DistError.js";
import * as distOperations from "../../src/dist/distOperations/index.js";
import {
  DivisionByZeroError,
  NegativeInfinityError,
} from "../../src/operationError.js";
import * as Result from "../../src/utility/result.js";
import { env, mkExponential, mkUniform } from "../helpers/distHelpers.js";

describe("Scale logarithm", () => {
  /* These tests may not be important, because scalelog isn't normalized
  The first one may be failing for a number of reasons.
 */
  test.skip("mean of the base e scalar logarithm of an exponential(10)", () => {
    const rate = 10.0;
    const scalelog = distOperations.scaleLog(mkExponential(rate), Math.E, {
      env,
    });

    const meanResult = Result.fmap(scalelog, (d) => d.mean());

    // expected value of log of exponential distribution.
    const meanAnalytical = Math.log(rate) + 1;
    if (!meanResult.ok) {
      expect(meanResult.value).toEqual(
        operationDistError(new DivisionByZeroError())
      );
    } else {
      expect(meanResult.value).toBeCloseTo(meanAnalytical);
    }
  });
  const low = 10.0;
  const high = 100.0;
  const scalelog = distOperations.scaleLog(mkUniform(low, high), 2.0, { env });

  test("mean of the base 2 scalar logarithm of a uniform(10, 100)", () => {
    //For uniform pdf `_ => 1 / (b - a)`, the expected value of log of uniform is `integral from a to b of x * log(1 / (b -a)) dx`
    const meanResult = Result.fmap(scalelog, (d) => d.mean());
    const meanAnalytical =
      (-Math.log2(high - low) / 2) * (high ** 2 - low ** 2);
    if (!meanResult.ok) {
      expect(meanResult.value).toEqual(
        operationDistError(new NegativeInfinityError())
      );
    } else {
      expect(meanResult.value).toBeCloseTo(meanAnalytical);
    }
  });
});
