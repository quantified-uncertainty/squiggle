import { mixture } from "../../src/dist/distOperations/index.js";
import {
  env,
  mkBeta,
  mkExponential,
  mkLognormal,
  mkNormal,
  mkUniform,
  unpackResult,
} from "../helpers/distHelpers.js";

describe("mixture", () => {
  test.each([
    [0.0, 1e2],
    [-1e1, -1e-4],
    [-1e1, 1e2],
    [-1e1, 1e1],
  ])("fair mean of two normal distributions", (mean1, mean2) => {
    // should be property
    const meanValue = unpackResult(
      mixture(
        [
          [mkNormal(mean1, 9e-1), 0.5],
          [mkNormal(mean2, 9e-1), 0.5],
        ],
        { env }
      )
    ).mean();
    expect(meanValue).toBeCloseTo((mean1 + mean2) / 2, -1);
  });

  test.each(
    // This would not survive property testing, it was easy for me to find cases that NaN'd out.
    [
      [128.0, 1.0, 2.0],
      [2e-1, 64.0, 16.0],
      [1, 1, 64.0],
    ]
  )("weighted mean of a beta and an exponential", (alpha, beta, rate) => {
    const betaWeight = 0.25;
    const exponentialWeight = 0.75;
    const meanValue = unpackResult(
      mixture(
        [
          [mkBeta(alpha, beta), betaWeight],
          [mkExponential(rate), exponentialWeight],
        ],
        { env }
      )
    ).mean();
    const betaMean = 1 / (1 + beta / alpha);
    const exponentialMean = 1 / rate;
    expect(meanValue).toBeCloseTo(
      betaWeight * betaMean + exponentialWeight * exponentialMean,
      -1
    );
  });

  test.each([
    [
      [-1e2, 1e1],
      [2, 1],
    ],
    [
      [-1e-16, 1e-16],
      [1e-8, 1],
    ],
    [
      [0.0, 1],
      [1, 1e-2],
    ],
  ])(
    "weighted mean of lognormal and uniform",
    // Would not survive property tests: very easy to find cases that NaN out.
    ([low, high], [mu, sigma]) => {
      const uniformWeight = 0.6;
      const lognormalWeight = 0.4;
      const meanValue = unpackResult(
        mixture(
          [
            [mkUniform(low, high), uniformWeight],
            [mkLognormal(mu, sigma), lognormalWeight],
          ],
          { env }
        )
      ).mean();
      const uniformMean = (low + high) / 2;
      const lognormalMean = mu + sigma ** 2 / 2;
      expect(meanValue).toBeCloseTo(
        uniformWeight * uniformMean + lognormalWeight * lognormalMean,
        -1
      );
    }
  );
});
