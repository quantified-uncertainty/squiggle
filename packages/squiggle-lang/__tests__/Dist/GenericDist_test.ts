import { BaseDist } from "../../src/Dist/BaseDist";
import { DistError } from "../../src/Dist/DistError";
import { SampleSetDist } from "../../src/Dist/SampleSetDist/SampleSetDist";
import { Env } from "../../src/js";
import * as RSResult from "../../src/rsResult";
import { Ok } from "../../src/rsResult";
import { unpackResult } from "../TestHelpers";

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
} from "./fixtures";

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    const result = RSResult.fmap(normalDist5.toPointSetDist(env), (p) =>
      p.mean()
    );

    expect(unpackResult(result)).toBeCloseTo(5, 0);
  });

  const pointSet = unpackResult(
    RSResult.bind(
      RSResult.bind(normalDist5.toPointSetDist(env), (pointSet) =>
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
  let runTest = (
    name: string,
    dist: BaseDist,
    expected: RSResult.rsResult<string, DistError>
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
