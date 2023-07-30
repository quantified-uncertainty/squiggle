import range from "lodash/range.js";
import flatten from "lodash/flatten.js";
import fc from "fast-check";

import { splitContinuousAndDiscrete as split } from "../../src/dist/SampleSetDist/splitContinuousAndDiscrete.js";

const makeTest = (params: {
  name: string;
  data: number[];
  minWeight: number;
  continuous: number[];
  discrete: { xs: number[]; ys: number[] };
}) => {
  test(params.name, () =>
    expect(split(params.data, params.minWeight)).toEqual({
      continuousSamples: params.continuous,
      discreteShape: params.discrete,
    })
  );
};

describe("Continuous and discrete splits", () => {
  makeTest({
    name: "is empty, with no common elements",
    data: [1.33455, 1.432, 2.0],
    minWeight: 2,
    continuous: [1.33455, 1.432, 2.0],
    discrete: { xs: [], ys: [] },
  });

  makeTest({
    name: "only stores 3.5 as discrete when minWeight is 3",
    data: [1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5],
    minWeight: 3,
    continuous: [1.33455, 1.432, 2.0, 2.0],
    discrete: { xs: [3.5], ys: [3] },
  });

  makeTest({
    name: "doesn't store 3.5 as discrete when minWeight is 5",
    data: [1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5],
    minWeight: 5,
    continuous: [1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5],
    discrete: { xs: [], ys: [] },
  });

  makeTest({
    name: "more general test",
    data: [10, 10, 11, 11, 11, 12, 13, 13, 13, 13, 13, 14],
    minWeight: 3,
    continuous: [10, 10, 12, 14],
    discrete: { xs: [11, 13], ys: [3, 5] },
  });

  const makeDuplicatedArray = (count: number) => {
    const arr = range(1, count + 1);
    return [...arr, ...arr, ...arr, ...arr].sort((a, b) => a - b);
  };

  test("split at count=10", () => {
    expect(split(makeDuplicatedArray(10), 2).discreteShape.xs.length).toEqual(
      10
    );
  });

  test("split at count=500", () => {
    expect(split(makeDuplicatedArray(500), 2).discreteShape.xs.length).toEqual(
      500
    );
  });

  // Function for fast-check property testing
  const testSegments = (counts: number[], weight: number) => {
    // Prepare segments of random-length equal numbers
    const segments: number[][] = [];
    let cur = 0;
    for (const count of counts) {
      cur += 0.01 + Math.random(); // random() can produce 0
      const segment: number[] = [];
      for (let i = 0; i < count; i++) {
        segment.push(cur);
      }
      segments.push(segment);
    }
    const allValues = flatten(segments);
    const result = split(allValues, weight);

    // Then split based on the segment length directly
    const contSegments = segments.filter((s) => s.length < weight);
    const discSegments = segments.filter((s) => s.length >= weight);

    expect(result.continuousSamples).toEqual(flatten(contSegments));
    expect(result.discreteShape).toEqual({
      xs: discSegments.map((s) => s[0]),
      ys: discSegments.map((s) => s.length),
    });
  };

  fc.assert(
    fc.property(
      fc.array(fc.integer({ max: 30 }), { minLength: 0, maxLength: 50 }), // random lengths of segments of equal values
      fc.integer({ min: 2, max: 20 }),
      testSegments
    )
  );
});
