import * as fc from "fast-check";
import { samplesToContinuousPdf } from "../../src/rescript/Distributions/SampleSetDist/KdeLibrary.js";
import range from "lodash/range";
import sumBy from "lodash/sumBy";

// KDE by definition, with triangular kernel max(0, |1-x|)
// https://en.wikipedia.org/wiki/Kernel_density_estimation#Definition
// Evaluate at the point x
const evalKde = (samples: number[], width: number, weight: number, x: number) =>
  (weight / width) *
  sumBy(samples, (p) => Math.max(0, 1 - Math.abs((x - p) / width)));

describe("Kernel density estimation", () => {
  test("should approximately equal naive definition", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -10, max: 10, noNaN: true }), {
          minLength: 6, // 5 samples or below filtered out in SampleSetDist.toPointSetDist
        }),
        fc.integer({ min: 4, max: 1e3 }), // 4 is the minimum allowed length
        fc.double({ min: 0.1, max: 3, noNaN: true }),
        (samples, outputLength, wantedWidth) => {
          const len = samples.length;
          const weight = 1 / len;
          const sortedSamples = samples.sort((a, b) => a - b);
          // The bandwidth recommendations always return a width less than the
          // range, so it doesn't make sense to test very large widths.
          // But fast-check might make the range of the samples arbitrarily
          // small, so we test here.
          if (sortedSamples[len - 1] - sortedSamples[0] < 2 * wantedWidth)
            return true;

          const {
            xs,
            ys,
            usedWidth: width,
          } = samplesToContinuousPdf(
            sortedSamples,
            outputLength,
            wantedWidth,
            weight
          );

          expect(xs.length).toEqual(outputLength);
          expect(ys.length).toEqual(outputLength);

          // Point range should be sample range plus width on either side
          expect(xs[0] + width).toBeCloseTo(sortedSamples[0]);
          expect(xs[outputLength - 1] - width).toBeCloseTo(
            sortedSamples[len - 1]
          );

          // No tail
          expect(ys[0]).toBeCloseTo(0);
          expect(ys[outputLength - 1]).toBeCloseTo(0);

          // Checking cost for each point is proportional to len.
          // We don't want to spend len * outputLength to check one function:
          // instead len * numChecks <= 10 * len + 1e3
          const numChecks = 10 + Math.floor(1e3 / len);
          const randomOutputIndex = () =>
            Math.floor(outputLength * Math.random());
          const allOutputIndices = () => range(outputLength);
          const indicesToCheck =
            numChecks >= outputLength
              ? allOutputIndices()
              : range(numChecks).map(randomOutputIndex);
          indicesToCheck.forEach((i) =>
            expect(ys[i]).toBeCloseTo(
              evalKde(sortedSamples, width, weight, xs[i])
            )
          );
        }
      )
    );
  });
});
