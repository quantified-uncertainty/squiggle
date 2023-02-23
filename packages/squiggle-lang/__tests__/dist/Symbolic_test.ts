import {
  mkBernoulli,
  mkBeta,
  mkMetalog,
  mkMetalogCdf,
  mkCauchy,
  mkExponential,
  mkLogistic,
  mkLognormal,
  mkNormal,
  mkTriangular,
  unpackResult,
  env,
} from "../helpers/distHelpers";
import * as SymbolicDist from "../../src/dist/SymbolicDist";
import * as Result from "../../src/utility/result";
import * as E_A_Floats from "../../src/utility/E_A_Floats";
import * as E_A from "../../src/utility/E_A";
import { createSparkline } from "../../src/utility/sparklines";
import { metalogBasisFunction } from "@quri/metalog";
import { defaultEnv } from "../../src/dist/env";

describe("(Symbolic) normalize", () => {
  test.each([-1e8, -1e-2, 0.0, 1e-4, 1e16])(
    "has no impact on normal distributions",
    (mean) => {
      const normalValue = mkNormal(mean, 2.0);
      const normalizedValue = normalValue.normalize();
      expect(normalizedValue).toEqual(normalValue);
    }
  );
});

describe("(Symbolic) mean", () => {
  test.each([-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16])(
    "of normal distributions",
    (mean) => {
      expect(mkNormal(mean, 4.0).mean()).toBeCloseTo(mean);
    }
  );

  test.skip("of normal(0, -1) (it NaNs out)", () => {
    expect(mkNormal(1e1, -1).mean()).toBeFalsy();
  });

  test("of normal(0, 1e-8) (it doesn't freak out at tiny stdev)", () => {
    expect(mkNormal(0.0, 1e-8).mean()).toBeCloseTo(0.0);
  });

  test.each([1e-7, 2.0, 10.0, 100.0])(
    "of exponential distributions",
    (rate) => {
      const meanValue = mkExponential(rate).mean();
      expect(meanValue).toBeCloseTo(1.0 / rate); // https://en.wikipedia.org/wiki/Exponential_distribution#Mean,_variance,_moments,_and_median
    }
  );

  test("of a cauchy distribution", () => {
    expect(() => {
      mkCauchy(1, 1).mean();
    }).toThrow();
  });

  test.each([
    [1.0, 2.0, 3.0],
    [-1e7, -1e-7, 1e-7],
    [-1e-7, 1, 1e7],
    [-1e-16, 0.0, 1e-16],
  ])("of triangular distributions", (low, medium, high) => {
    const meanValue = mkTriangular(low, medium, high).mean();
    expect(meanValue).toBeCloseTo((low + medium + high) / 3.0); // https://www.statology.org/triangular-distribution/
  });

  test.each([
    [1e-4, 6.4e1],
    [1.28e2, 1],
    [1e-16, 1e-16],
    [1e16, 1e16],
  ])("of beta distributions", (alpha, beta) => {
    let meanValue = mkBeta(alpha, beta).mean();
    expect(meanValue).toBeCloseTo(1 / (1 + beta / alpha)); // https://en.wikipedia.org/wiki/Beta_distribution#Mean
  });

  // TODO: this is not a means() test
  test.each([
    [-1e4, 1e1],
    [1e1, -1e4],
    [0, 0],
  ])("bad beta distributions", (alpha, beta) => {
    const r = SymbolicDist.Beta.make({ alpha, beta });
    expect(Result.getError(r)).toBe(
      "Beta distribution parameters must be positive"
    );
  });

  test.each([
    [0.39, 0.1],
    [0.08, 0.1],
    [0.8, 0.3],
  ])("of beta distributions from mean and standard dev", (mean, stdev) => {
    const betaDistribution = unpackResult(
      SymbolicDist.Beta.fromMeanAndStdev({ mean, stdev })
    );
    const meanValue = betaDistribution.mean();
    expect(meanValue).toBeCloseTo(mean);
  });

  test.each([
    [2.0, 4.0],
    [1e-7, 1e-2],
    [-1e6, 10.0],
    [1e2, 1e-5],
  ])("of lognormal distributions", (mu, sigma) => {
    const meanValue = mkLognormal(mu, sigma).mean();
    expect(meanValue).toBeCloseTo(Math.exp(mu + sigma ** 2.0 / 2.0)); // https://brilliant.org/wiki/log-normal-distribution/
  });

  // TODO: this is not a means() test
  test.each([
    [1e3, -1e2],
    [-1e8, -1e4],
  ])("bad lognormal distributions", (mu, sigma) => {
    const r = SymbolicDist.Lognormal.make({ mu, sigma });
    expect(Result.getError(r)).toBe(
      "Lognormal standard deviation must be larger than 0"
    );
  });

  test.each([
    [1e-5, 12.345],
    [-1e4, 1e4],
    [-1e16, -1e2],
    [5.3e3, 9e9],
  ])("of uniform distributions", (low, high) => {
    const meanValue = unpackResult(
      SymbolicDist.Uniform.make({ low, high })
    ).mean();
    expect(meanValue).toBeCloseTo((low + high) / 2.0); // https://en.wikipedia.org/wiki/Continuous_uniform_distribution#Moments
  });

  test("of a float", () => {
    const meanValue = unpackResult(SymbolicDist.Float.make(7.7)).mean();
    expect(meanValue).toBeCloseTo(7.7);
  });
});

describe("Normal distribution with sparklines", () => {
  const parameterWiseAdditionPdf = (
    n1: SymbolicDist.Normal,
    n2: SymbolicDist.Normal
  ) => {
    const normalDistAtSumMean = SymbolicDist.Normal.add(n1, n2);
    return (x: number) => unpackResult(normalDistAtSumMean.pdf(x));
  };

  const normalDistAtMean5 = mkNormal(5, 2);
  const normalDistAtMean10 = mkNormal(10, 2);
  const range20Float = E_A_Floats.range(0.0, 20.0, 20); // [0.0,1.0,2.0,3.0,4.0,...19.0,]

  test("mean=5 pdf", () => {
    const pdfNormalDistAtMean5 = (x: number) =>
      unpackResult(normalDistAtMean5.pdf(x));
    const sparklineMean5 = range20Float.map(pdfNormalDistAtMean5);
    expect(createSparkline(sparklineMean5)).toEqual(`▁▂▃▆██▇▅▂▁▁▁▁▁▁▁▁▁▁▁`);
  });

  test("parameter-wise addition of two normal distributions", () => {
    const sparklineMean15 = range20Float.map(
      parameterWiseAdditionPdf(normalDistAtMean5, normalDistAtMean10)
    );
    expect(createSparkline(sparklineMean15)).toEqual(`▁▁▁▁▁▁▁▁▁▂▃▄▆███▇▅▄▂`);
  });

  test("mean=10 cdf", () => {
    const cdfNormalDistAtMean10 = (x: number) => normalDistAtMean10.cdf(x);
    const sparklineMean10 = range20Float.map(cdfNormalDistAtMean10);
    expect(createSparkline(sparklineMean10)).toEqual(`▁▁▁▁▁▁▁▁▂▄▅▇████████`);
  });
});

describe("Logistic", () => {
  const dist = mkLogistic(0, 2);
  const testRange = 10;
  const testSteps = 1000;
  const step = (testRange * 2) / testSteps;
  const iter = E_A_Floats.range(-testRange, testRange, testSteps);

  test("CDF only grows", () => {
    const cdfValues = iter.map((v) => dist.cdf(v));
    expect(E_A.pairwise(cdfValues, (a, b) => a <= b).every((v) => v)).toBe(
      true
    );
  });

  test("CDF conforms to PDF", () => {
    expect(
      E_A.pairwise(
        iter.map((a) => [dist.cdf(a), unpackResult(dist.pdf(a))]),
        (a, b) => [a, b]
      ).every(
        ([[cdf, pdf], [cdf2]]) => Math.abs(cdf2 - cdf - pdf * step) < 0.0001
      )
    ).toBe(true);
  });

  test("Quantile is inverse of CDF", () => {
    expect(
      iter
        .map((p) => [p, dist.inv(dist.cdf(p))])
        .every(([p, pp]) => Math.abs(p - pp) < 0.00001)
    ).toBe(true);
  });

  test("stdev == sqrt(variance)", () => {
    expect(unpackResult(dist.stdev())).toBeCloseTo(
      Math.sqrt(unpackResult(dist.variance())),
      5
    );
  });
});

describe("Bernoulli", () => {
  const dist = mkBernoulli(0.5);
  const iter = [0.0, 1.0];
  const step = 1.0;

  test("CDF only grows", () => {
    const cdfValues = iter.map((v) => dist.cdf(v));
    expect(E_A.pairwise(cdfValues, (a, b) => a <= b).every((v) => v)).toBe(
      true
    );
  });

  test("CDF conforms to PDF", () => {
    expect(
      E_A.pairwise(
        iter.map((a) => [dist.cdf(a), unpackResult(dist.pdf(a))]),
        (a, b) => [a, b]
      ).every(
        ([[cdf, pdf], [cdf2]]) => Math.abs(cdf2 - cdf - pdf * step) < 0.0001
      )
    ).toBe(true);
  });

  test("Quantile is inverse of CDF", () => {
    expect(
      iter
        .map((p) => [p, dist.inv(dist.cdf(p))])
        .every(([p, pp]) => Math.abs(p - pp) < 0.00001)
    ).toBe(true);
  });

  test("stdev == sqrt(variance)", () => {
    expect(unpackResult(dist.stdev())).toBeCloseTo(
      Math.sqrt(unpackResult(dist.variance())),
      5
    );
  });
});

describe("Metalog", () => {
  const dist = mkMetalog([5, 2]);
  const testRange = 10;
  const testSteps = 1000;
  const step = (testRange * 2) / testSteps;
  const iter = E_A_Floats.range(-testRange, testRange, testSteps);

  test("CDF only grows", () => {
    const cdfValues = iter.map((v) => dist.cdf(v));
    expect(E_A.pairwise(cdfValues, (a, b) => a <= b).every((v) => v)).toBe(
      true
    );
  });

  test("CDF conforms to PDF", () => {
    expect(
      E_A.pairwise(
        iter.map((a) => [dist.cdf(a), unpackResult(dist.pdf(a))]),
        (a, b) => [a, b]
      ).forEach(([[cdf, pdf], [cdf2]]) =>
        expect(cdf2).toBeCloseTo(cdf + pdf * step)
      )
    );
  });

  test("Quantile is inverse of CDF", () => {
    expect(
      iter
        .map((p) => [p, dist.inv(dist.cdf(p))])
        .forEach(([p, pp]) => expect(p).toBeCloseTo(pp, 3))
    );
  });

  test("Succeeds with OLS fails", () => {
    const test = mkMetalogCdf([
      { x: -1.2, q: 0.05 },
      { x: 4, q: 0.2 },
      { x: 10, q: 0.9 },
      { x: 15, q: 0.95 },
    ]);
  });
  test("Fails with too little terms", () => {
    expect(() => mkMetalog([])).toThrowError();
    expect(() => mkMetalog([2])).toThrowError();
    expect(SymbolicDist.Metalog.fitFromCdf([{ x: 0, q: 0.1 }]).ok).toBe(false);
    expect(
      SymbolicDist.Metalog.fitFromCdf(
        [
          { x: 0, q: 0.1 },
          { x: 1, q: 0.5 },
          { x: 2, q: 0.7 },
        ],
        1
      ).ok
    ).toBe(false);
    expect(
      SymbolicDist.Metalog.fitFromCdf(
        [
          { x: 0, q: 0.1 },
          { x: 1, q: 0.5 },
          { x: 2, q: 0.7 },
        ],
        0
      ).ok
    ).toBe(false);
    expect(
      SymbolicDist.Metalog.fitFromCdf(
        [
          { x: 0, q: 0.1 },
          { x: 1, q: 0.5 },
          { x: 2, q: 0.7 },
        ],
        -1
      ).ok
    ).toBe(false);
  });

  test("CDF is close to fit", () => {
    const metalogDist = mkMetalogCdf([
      { x: 0, q: 0.2 },
      { x: 2, q: 0.5 },
      { x: 3, q: 0.9 },
    ]);
    expect(metalogDist.cdf(0)).toBeCloseTo(0.2);
    expect(metalogDist.cdf(2)).toBeCloseTo(0.5);
    expect(metalogDist.cdf(3)).toBeCloseTo(0.9);
  });

  test("Metalog Problem case, Xs out of order", () => {
    const points = [
      { x: 2, q: 0.2 },
      { x: 4, q: 0.5 },
      { x: 6, q: 0.7 },
      { x: 8.8, q: 0.9 },
    ];
    debugger;
    const metalogDist = mkMetalogCdf(points);
    const pointSetDist = metalogDist.toPointSetDist(defaultEnv);
    expect(pointSetDist.ok).toBe(true);
  });
  test("Metalog Problem case, Xs out of order (with explicit a)", () => {
    const a = [8.30161199, 0.80682723, -1.61734654, 14.36825478];
    const pointSetDist = mkMetalog(a).toPointSetDist(defaultEnv);
    expect(pointSetDist.ok).toBe(true);
  });
});
