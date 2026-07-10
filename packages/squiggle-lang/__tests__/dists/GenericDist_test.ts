import { BaseDist } from "../../src/dists/BaseDist.js";
import { DistError } from "../../src/dists/DistError.js";
import { SampleSetDist } from "../../src/dists/SampleSetDist/index.js";
import * as SymbolicDist from "../../src/dists/SymbolicDist/index.js";
import { Env } from "../../src/index.js";
import { getDefaultRng } from "../../src/rng/index.js";
import * as Result from "../../src/utility/result.js";
import { Ok } from "../../src/utility/result.js";
import {
  betaDist,
  cauchyDist,
  exponentialDist,
  lognormalDist,
  normalDist,
  normalDist10,
  normalDist5,
  point1,
  triangularDist,
  uniformDist,
} from "../fixtures/distFixtures.js";
import { unpackResult } from "../helpers/distHelpers.js";

const env: Env = {
  sampleCount: 100,
  xyPointLength: 100,
  seed: "TEST_SEED",
};
const rng = getDefaultRng();

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    const result = Result.fmap(normalDist5.toPointSetDist(env), (p) =>
      p.mean()
    );

    expect(unpackResult(result)).toBeCloseTo(5, 0);
  });

  const pointSet = unpackResult(
    Result.bind(
      Result.bind(normalDist5.toPointSetDist(env), (pointSet) =>
        SampleSetDist.fromDist(pointSet, env, rng)
      ),
      (sampleSet) => sampleSet.toPointSetDist(env)
    )
  );

  test("mean from sample set", () => {
    const mean = pointSet.mean();

    expect(mean).toBeCloseTo(5, -1);
  });

  test("isNormalized from sample set", () => {
    const isNormalized = pointSet.isNormalized();
    expect(isNormalized).toBe(true);
  });
});

describe("sparkline", () => {
  const runTest = (
    name: string,
    dist: BaseDist,
    expected: Result.result<string, DistError>
  ) => {
    test(name, () => {
      const result = dist.toSparkline(20, env);
      expect(result).toEqual(expected);
    });
  };

  runTest("normal", normalDist, Ok(`▁▁▁▁▁▂▄▆▇██▇▆▄▂▁▁▁▁▁`));

  runTest("uniform", uniformDist, Ok(`████████████████████`));

  runTest("beta", betaDist, Ok(`▁▄▇████▇▆▅▄▃▃▂▁▁▁▁▁▁`));

  runTest("lognormal", lognormalDist, Ok(`▁█▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`));

  runTest("cauchy", cauchyDist, Ok(`▁▁▁▁▁▁▁▁▁██▁▁▁▁▁▁▁▁▁`));

  runTest("triangular", triangularDist, Ok(`▁▁▂▃▄▅▆▇████▇▆▅▄▃▂▁▁`));

  runTest("exponential", exponentialDist, Ok(`█▅▄▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`));
});

describe("truncate", () => {
  // Regression test for https://github.com/quantified-uncertainty/squiggle/issues/2518
  // A discrete-only distribution (like a point mass) has an empty continuous
  // part. ContinuousShape.truncate used to append boundary sentinel points even
  // to that empty part, turning it into a zero-integral non-empty shape, so
  // MixedShape.normalize computed 0 / 0 = NaN and corrupted the distribution.
  test("point mass survives truncation to a range that contains it", () => {
    const pointMass = unpackResult(SymbolicDist.PointMass.make(0.5));
    const truncated = unpackResult(pointMass.truncate(1e-6, 1 - 1e-6, { env }));

    const mean = truncated.mean();
    expect(Number.isNaN(mean)).toBe(false);
    expect(mean).toBeCloseTo(0.5, 6);
  });

  test("continuous distribution truncation is unchanged", () => {
    const truncated = unpackResult(normalDist5.truncate(3, 8, { env }));

    const mean = truncated.mean();
    expect(Number.isFinite(mean)).toBe(true);
    expect(mean).toBeCloseTo(5, 0);
  });
});

describe("isEqual", () => {
  test("equal normal distributions", () => {
    expect(normalDist.isEqual(normalDist)).toBe(true);
  });
  test("different normal distributions", () => {
    expect(normalDist5.isEqual(normalDist10)).toBe(false);
  });
  test("different distribution types", () => {
    expect(normalDist.isEqual(point1)).toBe(false);
  });
});
