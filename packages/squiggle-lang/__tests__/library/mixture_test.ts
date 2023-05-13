import { testRun } from "../helpers/helpers.js";
import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("mixture", () => {
  testEvalToBe(
    "mx(normal(5,2), normal(10,1), normal(15, 1))",
    "Point Set Distribution"
  );
  testEvalToBe(
    "mixture(normal(5,2), normal(10,1), [0.2, 0.4])",
    "Point Set Distribution"
  );

  describe("Outputs Sample Sets when necessary", () => {
    testEvalToBe(
      "mixture(normal(5,2) -> SampleSet.fromDist, normal(10,1), [0.2, 0.4])",
      "Sample Set Distribution"
    );

    testEvalToBe(
      "mixture(normal(10, 1), normal(5,2) -> SampleSet.fromDist, [0.2, 0.4])",
      "Sample Set Distribution"
    );

    testEvalToBe(
      "mixture(normal(10, 1), normal(5,2) -> SampleSet.fromDist, [0.2, 0.4])",
      "Sample Set Distribution"
    );
  });

  describe("Sample Set mode keeps correlations", () => {
    expect(
      testRun("a = normal(0,1); m = mx(a, 3, [.999999,.00001]); stdev(a - m)")
        .value
    ).toBeGreaterThan(1);
    expect(
      testRun(
        "a = normal(0,1) -> SampleSet.fromDist; m = mx(a, 3, [.999999,.00001]); stdev(a - m)"
      ).value
    ).toBeCloseTo(0);
  });
});
