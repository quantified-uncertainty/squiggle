import { samplesToPointSetDist } from "../../src/dists/SampleSetDist/samplesToPointSetDist.js";
import { XYShape } from "../../src/XYShape.js";

// Deterministic pseudo-random numbers, so the test can't flake.
const makeRng = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

// Box-Muller, driven by the seeded rng.
const makeGaussian = (rng: () => number) => () => {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const lognormalFromCI =
  (low: number, high: number, gaussian: () => number) => () => {
    const mu = (Math.log(low) + Math.log(high)) / 2;
    const sigma = (Math.log(high) - Math.log(low)) / (2 * 1.6448536269514722);
    return Math.exp(mu + sigma * gaussian());
  };

const maxYIn = (shape: XYShape, minX: number, maxX: number) =>
  Math.max(
    ...shape.ys.filter((_, i) => shape.xs[i] >= minX && shape.xs[i] <= maxX)
  );

describe("samplesToPointSetDist", () => {
  // https://github.com/quantified-uncertainty/squiggle/issues/4103
  // The difference of two lognormals crosses zero. The log-KDE heuristic used
  // to fire on it (it looks heavy-tailed in absolute values), producing sharp
  // density spikes near zero that don't exist in the samples.
  test("sign-crossing samples don't get spurious density spikes near zero", () => {
    const gaussian = makeGaussian(makeRng(12345));
    const a = lognormalFromCI(0.5, 1, gaussian);
    const b = lognormalFromCI(0.5, 5, gaussian);
    const samples = Array.from({ length: 1000 }, () => b() - a());

    const { continuousDist } = samplesToPointSetDist({
      samples,
      continuousOutputLength: 1000,
    });

    expect(continuousDist).toBeDefined();
    const maxNearZero = maxYIn(continuousDist!, -0.1, 0.1);
    const maxElsewhere = Math.max(
      maxYIn(continuousDist!, -Infinity, -0.1),
      maxYIn(continuousDist!, 0.1, Infinity)
    );
    // With the log-KDE artifact, maxNearZero was 3x-50x maxElsewhere.
    expect(maxNearZero).toBeLessThan(maxElsewhere * 1.5);
  });

  test("all-positive heavy-tailed samples still use log KDE", () => {
    const gaussian = makeGaussian(makeRng(54321));
    const lognormal = lognormalFromCI(0.01, 100, gaussian);
    const samples = Array.from({ length: 1000 }, () => lognormal());

    const auto = samplesToPointSetDist({
      samples,
      continuousOutputLength: 1000,
    });
    const linear = samplesToPointSetDist({
      samples,
      continuousOutputLength: 1000,
      logScale: false,
    });

    // Log KDE concentrates many more points near zero than linear KDE does,
    // so the auto result should differ from the forced-linear one.
    expect(auto.continuousDist!.xs).not.toEqual(linear.continuousDist!.xs);
  });
});
