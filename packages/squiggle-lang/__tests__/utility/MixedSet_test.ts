import { MixedSet } from "../../src/utility/MixedSet.js";
import { XYShape } from "../../src/XYShape.js";

describe("MixedSet", () => {
  describe("fromContinuousDistShape", () => {
    test("creates a MixedSet with segments from a continuous shape", () => {
      const continuousShape: XYShape = {
        xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        ys: [0, 3, 8, 0, 0, 0, 1, 0, 0, 1, 0],
      };
      const support = MixedSet.fromContinuousDistShape(continuousShape);
      expect(support.numberSet.numbers).toEqual([]);
      expect(support.rangeSet.ranges).toEqual([
        [0, 3],
        [5, 7],
        [8, 10],
      ]);
    });
  });

  describe("difference", () => {
    const testCases = [
      {
        set1: new MixedSet([1, 2, 3], [[0, 10]]),
        set2: new MixedSet([2, 4], [[5, 6]]),
        expected: {
          points: [1, 3],
          segments: [
            [0, 5],
            [6, 10],
          ],
        },
      },
      {
        set1: new MixedSet([], []),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: { points: [], segments: [] },
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([], []),
        expected: { points: [1, 2], segments: [[3, 4]] },
      },
      {
        set1: new MixedSet([1, 2, 3, 4], []),
        set2: new MixedSet([2, 4], []),
        expected: { points: [1, 3], segments: [] },
      },
      {
        set1: new MixedSet(
          [],
          [
            [0, 5],
            [7, 10],
          ]
        ),
        set2: new MixedSet(
          [],
          [
            [2, 4],
            [8, 9],
          ]
        ),
        expected: {
          points: [],
          segments: [
            [0, 2],
            [4, 5],
            [7, 8],
            [9, 10],
          ],
        },
      },
      {
        set1: new MixedSet(
          [1, 3, 5],
          [
            [0, 2],
            [4, 6],
            [8, 10],
          ]
        ),
        set2: new MixedSet(
          [3],
          [
            [1, 5],
            [9, 10],
          ]
        ),
        expected: {
          points: [1, 5],
          segments: [
            [0, 1],
            [5, 6],
            [8, 9],
          ],
        },
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the difference between ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const difference = set1.difference(set2);

        expect(difference.numberSet.numbers).toEqual(expected.points);
        expect(difference.rangeSet.ranges).toEqual(expected.segments);
      });
    });
  });

  describe("intersection", () => {
    const testCases = [
      {
        set1: new MixedSet([1, 2, 3], [[0, 10]]),
        set2: new MixedSet([2, 4], [[5, 6]]),
        expected: {
          points: [2],
          segments: [[5, 6]],
        },
      },
      {
        set1: new MixedSet([], []),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: { points: [], segments: [] },
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([], []),
        expected: { points: [], segments: [] },
      },
      {
        set1: new MixedSet([1, 2, 3, 4], []),
        set2: new MixedSet([2, 4], []),
        expected: { points: [2, 4], segments: [] },
      },
      {
        set1: new MixedSet(
          [],
          [
            [0, 5],
            [7, 10],
          ]
        ),
        set2: new MixedSet(
          [],
          [
            [2, 4],
            [8, 9],
          ]
        ),
        expected: {
          points: [],
          segments: [
            [2, 4],
            [8, 9],
          ],
        },
      },
      {
        set1: new MixedSet(
          [1, 3, 5],
          [
            [0, 2],
            [4, 6],
            [8, 10],
          ]
        ),
        set2: new MixedSet(
          [3],
          [
            [1, 5],
            [9, 10],
          ]
        ),
        expected: {
          points: [3],
          segments: [
            [1, 2],
            [4, 5],
            [9, 10],
          ],
        },
      },
      {
        set1: new MixedSet([], [[0, 10]]),
        set2: new MixedSet(
          [],
          [
            [1, 2],
            [3, 5],
            [9, 10],
          ]
        ),
        expected: {
          points: [],
          segments: [
            [1, 2],
            [3, 5],
            [9, 10],
          ],
        },
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the intersection between ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const intersection = set1.intersection(set2);
        expect(intersection.numberSet.numbers).toEqual(expected.points);
        expect(intersection.rangeSet.ranges).toEqual(expected.segments);
      });
    });
  });

  describe("union", () => {
    const testCases = [
      {
        set1: new MixedSet([1, 2, 3], [[0, 10]]),
        set2: new MixedSet([2, 4], [[5, 6]]),
        expected: {
          points: [1, 2, 3, 4],
          segments: [[0, 10]],
        },
      },
      {
        set1: new MixedSet([], []),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: { points: [1, 2], segments: [[3, 4]] },
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([], []),
        expected: { points: [1, 2], segments: [[3, 4]] },
      },
      {
        set1: new MixedSet([1, 2, 3, 4], []),
        set2: new MixedSet([2, 4, 5], []),
        expected: { points: [1, 2, 3, 4, 5], segments: [] },
      },
      {
        set1: new MixedSet(
          [],
          [
            [0, 5],
            [7, 10],
          ]
        ),
        set2: new MixedSet(
          [],
          [
            [2, 4],
            [8, 12],
          ]
        ),
        expected: {
          points: [],
          segments: [
            [0, 5],
            [7, 12],
          ],
        },
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns the union of ${JSON.stringify(set1)} and ${JSON.stringify(set2)}`, () => {
        const union = set1.union(set2);
        expect(union.numberSet.numbers).toEqual(expected.points);
        expect(union.rangeSet.ranges).toEqual(expected.segments);
      });
    });
  });

  describe("isSubsetOf", () => {
    const testCases = [
      {
        set1: new MixedSet([1, 2], [[0, 5]]),
        set2: new MixedSet([1, 2, 3], [[0, 10]]),
        expected: true,
      },
      {
        set1: new MixedSet([1, 2, 3], [[0, 10]]),
        set2: new MixedSet([1, 2], [[0, 5]]),
        expected: false,
      },
      {
        set1: new MixedSet([], []),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: true,
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([], []),
        expected: false,
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: true,
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns ${expected} for ${JSON.stringify(set1)}.isSubsetOf(${JSON.stringify(set2)})`, () => {
        expect(set1.isSubsetOf(set2)).toBe(expected);
      });
    });
  });

  describe("isSupersetOf", () => {
    const testCases = [
      {
        set1: new MixedSet([1, 2, 3], [[0, 10]]),
        set2: new MixedSet([1, 2], [[0, 5]]),
        expected: true,
      },
      {
        set1: new MixedSet([1, 2], [[0, 5]]),
        set2: new MixedSet([1, 2, 3], [[0, 10]]),
        expected: false,
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([], []),
        expected: true,
      },
      {
        set1: new MixedSet([], []),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: false,
      },
      {
        set1: new MixedSet([1, 2], [[3, 4]]),
        set2: new MixedSet([1, 2], [[3, 4]]),
        expected: true,
      },
    ];

    testCases.forEach(({ set1, set2, expected }) => {
      test(`returns ${expected} for ${JSON.stringify(set1)}.isSupersetOf(${JSON.stringify(set2)})`, () => {
        expect(set1.isSupersetOf(set2)).toBe(expected);
      });
    });
  });

  describe("minX", () => {
    test("returns the minimum x-value from points and segments", () => {
      const support = new MixedSet(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(support.min()).toBe(0);
    });

    test("returns undefined for an empty MixedSet", () => {
      const emptyDomain = new MixedSet([], []);
      expect(emptyDomain.min()).toBeUndefined();
    });
  });

  describe("maxX", () => {
    test("returns the maximum x-value from points and segments", () => {
      const support = new MixedSet(
        [1, 2],
        [
          [0, 1],
          [3, 4],
        ]
      );
      expect(support.max()).toBe(4);
    });

    test("returns undefined for an empty MixedSet", () => {
      const emptyDomain = new MixedSet([], []);
      expect(emptyDomain.max()).toBeUndefined();
    });
  });
});
