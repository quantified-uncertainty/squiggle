import { BaseDist } from "../../src/dist/BaseDist.js";
import { DistError } from "../../src/dist/DistError.js";
import { SampleSetDist } from "../../src/dist/SampleSetDist/index.js";
import { Env } from "../../src/index.js";
import * as Result from "../../src/utility/result.js";
import { Ok } from "../../src/utility/result.js";
import { unpackResult } from "../helpers/distHelpers.js";

const env: Env = {
  sampleCount: 100,
  xyPointLength: 100,
};

import {
  normalDist5,
  normalDist,
  uniformDist,
  betaDist,
  lognormalDist,
  cauchyDist,
  triangularDist,
  exponentialDist,
  point1,
  normalDist10,
} from "../fixtures/distFixtures.js";

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
        SampleSetDist.fromDist(pointSet, env)
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
