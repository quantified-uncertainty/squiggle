import * as fc from "fast-check";
import { samplesToContinuousPdf } from "../../src/rescript/Distributions/SampleSetDist/KdeLibrary.js";
import range from "lodash/range";

const evalKde = (samples: number[], width: number, weight: number, x: number) =>
  (weight / width) *
  samples
    .map((p) => Math.max(0, 1 - Math.abs((p - x) / width)))
    .reduce((a, b) => a + b);

describe("Kernel density estimation", () => {
  test("should approximately equal naive definition", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -10, max: 10, noNaN: true }), {
          minLength: 6,
        }),
        fc.integer({ min: 4, max: 1e3 }),
        fc.double({ min: 0.1, max: 3, noNaN: true }),
        (samples, size, wantedWidth) => {
          const len = samples.length;
          const weight = 1 / len;
          const sortedSamples = samples.sort((a, b) => a - b);
          if (sortedSamples[len - 1] - sortedSamples[0] < 2 * wantedWidth)
            return true;

          const {
            xs,
            ys,
            usedWidth: width,
          } = samplesToContinuousPdf(sortedSamples, size, wantedWidth, weight);

          expect(xs.length).toEqual(size);
          expect(ys.length).toEqual(size);

          // Point range should be sample range plus width on either side
          expect(xs[0] + width).toBeCloseTo(sortedSamples[0]);
          expect(xs[size - 1] - width).toBeCloseTo(sortedSamples[len - 1]);

          // No tail
          expect(ys[0]).toBeCloseTo(0);
          expect(ys[size - 1]).toBeCloseTo(0);

          // Checking cost is proportional to len
          const numChecks = 10 + Math.floor(1e3 / len);
          const checkInds =
            numChecks >= size
              ? range(size)
              : range(numChecks).map(() => Math.floor(size * Math.random()));
          checkInds.forEach((i) =>
            expect(ys[i]).toBeCloseTo(
              evalKde(sortedSamples, width, weight, xs[i])
            )
          );
        }
      )
    );
  });
});
