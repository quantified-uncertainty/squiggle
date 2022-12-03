import { testRun, expectErrorToBeBounded } from "../helpers/helpers";
import * as fc from "fast-check";

// via fast-check hint
const toFloat32 = (v: number) => new Float32Array([v])[0];

describe("Mean of mixture is weighted average of means", () => {
  test("mx(normal(a,b), beta(m,s), [x,y])", () => {
    fc.assert(
      fc.property(
        // normal mean
        fc.float({ min: toFloat32(0.1), max: 10, noNaN: true }),
        // normal stdev
        fc.float({
          min: toFloat32(1), // low stdev is buggy, https://github.com/quantified-uncertainty/squiggle/issues/1415
          max: 10,
          noNaN: true,
        }),
        // \alpha in beta distribution
        fc.float({
          min: 2, // low a and b values are buggy, https://github.com/quantified-uncertainty/squiggle/issues/1412
          max: 10,
          noNaN: true,
        }),
        // \beta in beta distribution
        fc.float({
          min: 2,
          max: 10,
          noNaN: true,
        }),
        fc.float({ min: toFloat32(1e-7), max: 100, noNaN: true }),
        fc.float({ min: toFloat32(1e-7), max: 100, noNaN: true }),
        (normalMean, normalStdev, betaA, betaB, x, y) => {
          // normaalize is due to https://github.com/quantified-uncertainty/squiggle/issues/1400 bug
          const squiggleString = `mean(mixture(normal(${normalMean},${normalStdev}), beta(${betaA},${betaB}), [${x}, ${y}])->normalize)`;
          const res = testRun(squiggleString);
          const weightDenom = x + y;
          const normalWeight = x / weightDenom;
          const betaWeight = y / weightDenom;
          const betaMean = betaA / (betaA + betaB);
          if (res.tag !== "Number") {
            throw new Error(`Expected number result, got: ${res.tag}`);
          }
          expectErrorToBeBounded(
            res.value,
            normalWeight * normalMean + betaWeight * betaMean,
            // this is a huge allowed error, but it's the highest precision we can achieve because of this bug: https://github.com/quantified-uncertainty/squiggle/issues/1414, even on relatively high \alpha and \beta values
            { epsilon: 0.7 }
          );
        }
      )
    );
  });
});
